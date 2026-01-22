import {App, Modal, Notice, Setting} from "obsidian";
import AITerminalPlugin from "../main";
import {AgentConfig, CommandTemplate} from "../types";
import {generateUUID} from "../utils/uuid";

const MAX_AGENT_NAME_LENGTH = 100;

export class AgentListEditor {
	constructor(private app: App, private plugin: AITerminalPlugin) {}

	render(containerEl: HTMLElement, onChange: () => void): void {
		const agents = this.plugin.settings.agents;

		new Setting(containerEl)
			.setName("AI agents")
			.setHeading();

		containerEl.createEl("p", {
			text: "Configure available AI agents used by command templates and direct prompts. Enabled agents will appear in the direct prompt dialog dropdown.",
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
					const modal = new AgentEditorModal(
						this.app,
						{...agent},
						this.plugin.settings.agents.filter((_, currentIndex) => currentIndex !== index),
						async (updated) => {
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
		const affectedTemplates = this.getTemplatesUsingAgent(agent.id);
		if (affectedTemplates.length === 0) {
			await this.deleteAgent(agent.id);
			return;
		}
		const templateList = affectedTemplates.map(template => template.name).join(", ");
		new Notice(
			`This agent is used by the following templates and cannot be deleted: ${templateList}. ` +
			"Reassign or remove those templates before deleting the agent."
		);
	}

	private async deleteAgent(agentId: string): Promise<void> {
		this.plugin.settings.agents = this.plugin.settings.agents.filter(agent => agent.id !== agentId);
		await this.plugin.saveSettings();
		new Notice("Agent deleted");
	}

	private getTemplatesUsingAgent(agentId: string): CommandTemplate[] {
		return this.plugin.settings.commands.filter(command => command.agentId === agentId);
	}
}

export class AgentEditorModal extends Modal {
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
			id: generateUUID(),
			name: "",
			enabled: true
		};
		this.existingAgents = existingAgents;
		this.onSave = onSave;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();

		const headerEl = contentEl.createDiv({cls: "ai-terminal-modal-header"});
		headerEl.createEl("h2", {text: this.isEdit ? "Edit agent" : "New agent"});
		const headerButtonContainer = headerEl.createDiv({cls: "ai-terminal-header-buttons"});

		const cancelButton = headerButtonContainer.createEl("button", {text: "Cancel"});
		cancelButton.addEventListener("click", () => this.close());

		const saveButton = headerButtonContainer.createEl("button", {
			text: "Save",
			cls: "mod-cta"
		});
		saveButton.addEventListener("click", () => {
			void this.save();
		});

		new Setting(contentEl)
			.setName("Agent name")
			.setDesc("Used for display and command")
			.addText(text => text
				.setPlaceholder("Copilot")
				.setValue(this.agent.name)
				.onChange(value => {
					this.isDirty = true;
					this.agent.name = value;
				}));

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
			return agent.id !== this.agent.id && agent.name.toLowerCase() === normalized;
		});
		if (duplicateName) {
			new Notice("Agent name is already used by another agent. You can still save.");
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

