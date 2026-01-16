import {App, Modal, Notice, Setting} from "obsidian";
import AITerminalPlugin from "../main";
import {AgentConfig, CommandTemplate} from "../types";

const MAX_AGENT_NAME_LENGTH = 100;

export class AgentListEditor {
	constructor(private app: App, private plugin: AITerminalPlugin) {}

	render(containerEl: HTMLElement, onChange: () => void): void {
		const agents = this.plugin.settings.agents;

		new Setting(containerEl)
			.setName("AI agents")
			.setHeading();

		containerEl.createEl("p", {
			text: "Configure available AI agents used by command templates and direct prompts.",
			cls: "setting-item-description"
		});

		new Setting(containerEl)
			.setName("Add new agent")
			.setDesc("Create a new AI agent entry")
			.addButton(button => button
				.setButtonText("Add agent")
				.setCta()
				.onClick(() => {
					const modal = new AgentEditorModal(
						this.app,
						null,
						this.plugin.settings.agents,
						async (agent) => {
							this.plugin.settings.agents.push(agent);
							await this.plugin.saveSettings();
							onChange();
						}
					);
					modal.open();
				}));

		if (agents.length === 0) {
			containerEl.createEl("p", {
				text: "No agents configured yet. Select add agent to create one.",
				cls: "setting-item-description"
			});
			return;
		}

		agents.forEach((agent, index) => {
			const setting = new Setting(containerEl)
				.setName(agent.name)
				.setDesc("Used for display and command.");

			setting.addToggle(toggle => toggle
				.setValue(agent.enabled)
				.onChange(async (value) => {
					agent.enabled = value;
					await this.plugin.saveSettings();
					onChange();
				}));

			setting.addButton(button => button
				.setButtonText("Edit")
				.onClick(() => {
					const previousName = agent.name;
					const modal = new AgentEditorModal(
						this.app,
						{...agent},
						this.plugin.settings.agents.filter((_, currentIndex) => currentIndex !== index),
						async (updated) => {
							if (previousName !== updated.name) {
								await this.renameAgent(previousName, updated.name);
							}
							this.plugin.settings.agents[index] = updated;
							await this.plugin.saveSettings();
							onChange();
						}
					);
					modal.open();
				}));

			if (index > 0) {
				setting.addButton(button => button
					.setIcon("up-chevron-glyph")
					.setTooltip("Move up")
					.onClick(async () => {
						const [current] = this.plugin.settings.agents.splice(index, 1);
						if (!current) {
							return;
						}
						this.plugin.settings.agents.splice(index - 1, 0, current);
						await this.plugin.saveSettings();
						onChange();
					}));
			}

			if (index < agents.length - 1) {
				setting.addButton(button => button
					.setIcon("down-chevron-glyph")
					.setTooltip("Move down")
					.onClick(async () => {
						const [current] = this.plugin.settings.agents.splice(index, 1);
						if (!current) {
							return;
						}
						this.plugin.settings.agents.splice(index + 1, 0, current);
						await this.plugin.saveSettings();
						onChange();
					}));
			}

			setting.addButton(button => button
				.setIcon("trash")
				.setTooltip("Remove")
				.setWarning()
				.onClick(async () => {
					await this.handleDeleteAgent(agent);
					onChange();
				}));
		});
	}

	private async handleDeleteAgent(agent: AgentConfig): Promise<void> {
		const affectedTemplates = this.getTemplatesUsingAgent(agent.name);
		if (affectedTemplates.length === 0) {
			await this.deleteAgent(agent.name);
			return;
		}

		const templateList = affectedTemplates.map(template => `• ${template.name}`).join("\n");
		return await new Promise(resolve => {
			const modal = new ConfirmationModal(
				this.app,
				"Agent in use",
				`This agent is used by the following templates:\n${templateList}\n\nDelete anyway?`,
				"Delete agent",
				async () => {
					await this.deleteAgent(agent.name);
					resolve();
				},
				() => resolve()
			);
			modal.open();
		});
	}

	private async deleteAgent(agentName: string): Promise<void> {
		this.plugin.settings.agents = this.plugin.settings.agents.filter(agent => agent.name !== agentName);
		await this.plugin.saveSettings();
		new Notice("Agent deleted");
	}

	private getTemplatesUsingAgent(agentName: string): CommandTemplate[] {
		return this.plugin.settings.commands.filter(command => command.agentName === agentName);
	}

	private async renameAgent(oldName: string, newName: string): Promise<void> {
		this.plugin.settings.commands.forEach(command => {
			if (command.agentName === oldName) {
				command.agentName = newName;
			}
		});
		await this.plugin.saveSettings();
	}
}

class AgentEditorModal extends Modal {
	private agent: AgentConfig;
	private isEdit: boolean;
	private onSave: (agent: AgentConfig) => Promise<void>;
	private existingAgents: AgentConfig[];
	private isDirty = false;

	constructor(
		app: App,
		agent: AgentConfig | null,
		existingAgents: AgentConfig[],
		onSave: (agent: AgentConfig) => Promise<void>
	) {
		super(app);
		this.isEdit = !!agent;
		this.agent = agent || {
			name: "",
			enabled: true
		};
		this.existingAgents = existingAgents;
		this.onSave = onSave;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", {text: this.isEdit ? "Edit Agent" : "New Agent"});

		new Setting(contentEl)
			.setName("Agent name")
			.setDesc("Used for display and command")
			.addText(text => text
				.setPlaceholder("copilot")
				.setValue(this.agent.name)
				.onChange(value => {
					this.isDirty = true;
					this.agent.name = value;
				}));

		const buttonContainer = contentEl.createDiv({cls: "modal-button-container"});
		const cancelButton = buttonContainer.createEl("button", {text: "Cancel"});
		cancelButton.addEventListener("click", () => this.close());

		const saveButton = buttonContainer.createEl("button", {
			text: "Save",
			cls: "mod-cta"
		});
		saveButton.addEventListener("click", () => {
			void this.save();
		});
	}

	private validateAgent(): string | null {
		const name = this.agent.name.trim();

		if (!name) {
			return "Agent name is required.";
		}
		if (name.length > MAX_AGENT_NAME_LENGTH) {
			return `Agent name must be ${MAX_AGENT_NAME_LENGTH} characters or fewer.`;
		}

		const normalized = name.toLowerCase();
		const duplicateName = this.existingAgents.some(agent => {
			return agent.name.toLowerCase() === normalized;
		});
		if (duplicateName) {
			return "Agent name already exists. Please choose a unique name.";
		}

		return null;
	}

	private async save(): Promise<void> {
		if (!this.isDirty && !this.isEdit) {
			this.isDirty = true;
		}

		const error = this.validateAgent();
		if (error) {
			new Notice(error);
			return;
		}

		try {
			await this.onSave({
				...this.agent,
				name: this.agent.name.trim()
			});
			new Notice(`Agent ${this.isEdit ? "updated" : "created"} successfully`);
			this.isDirty = false;
			this.close();
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			new Notice(`Error: ${message}`);
		}
	}
}

class ConfirmationModal extends Modal {
	private titleText: string;
	private message: string;
	private confirmText: string;
	private onConfirm: () => void;
	private onCancel: () => void;
	private didResolve = false;

	constructor(
		app: App,
		titleText: string,
		message: string,
		confirmText: string,
		onConfirm: () => void,
		onCancel: () => void
	) {
		super(app);
		this.titleText = titleText;
		this.message = message;
		this.confirmText = confirmText;
		this.onConfirm = onConfirm;
		this.onCancel = onCancel;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", {text: this.titleText});
		contentEl.createEl("p", {text: this.message});

		const buttonContainer = contentEl.createDiv({cls: "modal-button-container"});
		const cancelButton = buttonContainer.createEl("button", {text: "Cancel"});
		cancelButton.addEventListener("click", () => {
			this.didResolve = true;
			this.onCancel();
			this.close();
		});

		const confirmButton = buttonContainer.createEl("button", {
			text: this.confirmText,
			cls: "mod-warning"
		});
		confirmButton.addEventListener("click", () => {
			this.didResolve = true;
			this.onConfirm();
			this.close();
		});

		cancelButton.focus();
	}

	onClose() {
		if (!this.didResolve) {
			this.onCancel();
		}
		this.contentEl.empty();
	}
}
