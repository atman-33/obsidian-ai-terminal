import {App, Modal, Setting, Notice} from "obsidian";
import {AgentConfig, CommandTemplate, AVAILABLE_PLACEHOLDERS} from "../types";
import {generateUUID} from "../utils/uuid";

/**
 * Modal for creating or editing command templates
 */
export class CommandEditorModal extends Modal {
	private command: Partial<CommandTemplate>;
	private isEdit: boolean;
	private originalId?: string;
	private onSave: (command: CommandTemplate) => Promise<void>;
	private agents: AgentConfig[];
	private isDirty = false;
	private skipConfirmation = false;

	constructor(
		app: App,
		command: Partial<CommandTemplate> | null,
		agents: AgentConfig[],
		onSave: (command: CommandTemplate) => Promise<void>
	) {
		super(app);
		this.isEdit = !!command;
		this.originalId = command?.id;
		this.agents = agents;
		const defaultAgentName = this.getEnabledAgents()[0]?.name ?? "";
		this.command = command || {
			id: generateUUID(),
			name: "",
			template: "",
			defaultPrompt: "",
			agentName: defaultAgentName,
			enabled: true
		};
		this.onSave = onSave;
	}

	onOpen() {
		const {contentEl} = this;
		
		contentEl.empty();

		const headerEl = contentEl.createDiv({cls: "ai-terminal-modal-header"});
		headerEl.createEl("h2", {text: this.isEdit ? "Edit Command Template" : "New Command Template"});
		const headerButtonContainer = headerEl.createDiv({cls: "ai-terminal-header-buttons"});

		const cancelButton = headerButtonContainer.createEl("button", {text: "Cancel"});
		cancelButton.addEventListener("click", () => {
			void this.handleCloseRequest();
		});

		const saveButton = headerButtonContainer.createEl("button", {
			text: "Save",
			cls: "mod-cta"
		});
		saveButton.addEventListener("click", () => {
			void this.save();
		});

		// Name field
		new Setting(contentEl)
			.setName("Display name")
			.setDesc("Name shown in menus and command palette")
			.addText(text => text
				.setPlaceholder("My command")
				.setValue(this.command.name || "")
				.onChange(value => {
					this.isDirty = true;
					this.command.name = value;
				}));

		// Template field
		const templateSetting = new Setting(contentEl)
			.setName("Command template")
			.setDesc("Command with placeholders (e.g., copilot -i <prompt>)")
			.addTextArea(text => {
				text
					.setPlaceholder('copilot -i <prompt>')
					.setValue(this.command.template || "")
					.onChange(value => {
						this.isDirty = true;
						this.command.template = value;
					});
				text.inputEl.rows = 4;
				text.inputEl.setCssProps({ width: "100%" });
			});
		templateSetting.settingEl.addClass("ai-terminal-vertical-field");

		// Default Prompt field
		const promptSetting = new Setting(contentEl)
			.setName("Default prompt (optional)")
			.setDesc("Default value for <prompt> placeholder")
			.addTextArea(text => {
				text
					.setPlaceholder("Fix issues in <file>")
					.setValue(this.command.defaultPrompt || "")
					.onChange(value => {
						this.isDirty = true;
						this.command.defaultPrompt = value;
					});
				text.inputEl.rows = 6;
				text.inputEl.setCssProps({ width: "100%" });
			});
		promptSetting.settingEl.addClass("ai-terminal-vertical-field");

		// Agent selection
		const enabledAgents = this.getEnabledAgents();
		const currentAgent = this.command.agentName
			? this.agents.find(agent => agent.name === this.command.agentName)
			: undefined;
		const isMissingAgent = !!this.command.agentName && !currentAgent;
		const isDisabledAgent = !!currentAgent && !currentAgent.enabled;

		const agentSetting = new Setting(contentEl)
			.setName("Agent")
			.setDesc("Select the AI agent for this template")
			.addDropdown(dropdown => {
				if (isMissingAgent) {
					dropdown.addOption(this.command.agentName || "", `[Deleted Agent] (${this.command.agentName})`);
				} else if (isDisabledAgent) {
					dropdown.addOption(this.command.agentName || "", `[Disabled Agent] ${currentAgent?.name ?? ""}`.trim());
				}

				enabledAgents.forEach(agent => {
					dropdown.addOption(agent.name, agent.name);
				});

				const fallbackAgentName = enabledAgents[0]?.name ?? this.command.agentName ?? "";
				if (!this.command.agentName && fallbackAgentName) {
					this.command.agentName = fallbackAgentName;
				}
				dropdown.setValue(this.command.agentName || fallbackAgentName);
				dropdown.setDisabled(enabledAgents.length === 0);
				dropdown.onChange(value => {
					this.isDirty = true;
					this.command.agentName = value;
				});
			});

		if (enabledAgents.length === 0) {
			agentSetting.setDesc("Please configure at least one AI agent in settings.");
		}
		if (isMissingAgent) {
			contentEl.createEl("p", {
				text: "This template references a deleted agent. Please select a new agent.",
				cls: "setting-item-description"
			});
		}

		// enabled toggle
		new Setting(contentEl)
			.setName("Enabled")
			.setDesc("Whether this command is active")
			.addToggle(toggle => toggle
				.setValue(this.command.enabled ?? true)
				.onChange(value => {
					this.isDirty = true;
					this.command.enabled = value;
				}));

		// Placeholder reference
		const referenceEl = contentEl.createDiv({cls: "ai-terminal-placeholder-reference"});
		referenceEl.createEl("h4", {text: "Available placeholders"});
		const list = referenceEl.createEl("ul");

		AVAILABLE_PLACEHOLDERS.forEach(placeholder => {
			const item = list.createEl("li");
			item.createEl("code", {text: `<${placeholder.name}>`});
			item.appendText(`: ${placeholder.description}`);
		});

	}

	private getEnabledAgents(): AgentConfig[] {
		return this.agents.filter(agent => agent.enabled);
	}

	private shouldConfirmDiscard(): boolean {
		return this.isDirty && !this.skipConfirmation;
	}

	private async handleCloseRequest(reopenOnCancel = false): Promise<void> {
		if (!this.shouldConfirmDiscard()) {
			this.skipConfirmation = true;
			this.close();
			return;
		}

		const shouldDiscard = await this.confirmDiscardChanges();
		if (shouldDiscard) {
			this.skipConfirmation = true;
			this.close();
			return;
		}

		if (reopenOnCancel) {
			this.open();
		}
	}

	private async confirmDiscardChanges(): Promise<boolean> {
		return await new Promise(resolve => {
			const modal = new ConfirmationModal(
				this.app,
				"Unsaved changes",
				"You have unsaved changes. Are you sure you want to close without saving?",
				"Close Anyway",
				() => resolve(true),
				() => resolve(false)
			);
			modal.open();
		});
	}

	async save() {
		// Validation
		if (!this.command.id || !this.command.name || !this.command.template) {
			new Notice("Please fill in all required fields (ID, name, template)");
			return;
		}

		if (!this.command.agentName) {
			new Notice("Please select an agent for this command.");
			return;
		}

		try {
			await this.onSave(this.command as CommandTemplate);
			new Notice(`Command template ${this.isEdit ? "updated" : "created"} successfully`);
			this.isDirty = false;
			this.skipConfirmation = true;
			this.close();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Error: ${message}`);
		}
	}

	onClose() {
		if (this.shouldConfirmDiscard()) {
			void this.handleCloseRequest(true);
			return;
		}

		const {contentEl} = this;
		contentEl.empty();
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
		const cancelButton = buttonContainer.createEl("button", {text: "Keep editing"});
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
