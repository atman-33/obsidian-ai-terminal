import {App, Modal, Setting, Notice} from "obsidian";
import {CommandTemplate, AVAILABLE_PLACEHOLDERS} from "../types";

/**
 * Modal for creating or editing command templates
 */
export class CommandEditorModal extends Modal {
	private command: Partial<CommandTemplate>;
	private isEdit: boolean;
	private originalId?: string;
	private onSave: (command: CommandTemplate) => Promise<void>;
	private isDirty = false;
	private skipConfirmation = false;

	constructor(
		app: App,
		command: Partial<CommandTemplate> | null,
		onSave: (command: CommandTemplate) => Promise<void>
	) {
		super(app);
		this.isEdit = !!command;
		this.originalId = command?.id;
		this.command = command || {
			id: "",
			name: "",
			template: "",
			defaultPrompt: "",
			defaultAgent: "",
			enabled: true
		};
		this.onSave = onSave;
	}

	onOpen() {
		const {contentEl} = this;
		
		contentEl.empty();
		contentEl.createEl("h2", {text: this.isEdit ? "Edit Command Template" : "New Command Template"});

		// ID field
		new Setting(contentEl)
			.setName("Command ID")
			.setDesc("Unique identifier (kebab-case, no spaces)")
			.addText(text => {
				text
					.setPlaceholder("My-command-id")
					.setValue(this.command.id || "")
					.onChange(value => {
						this.isDirty = true;
						this.command.id = value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
					});
				
				if (this.isEdit) {
					text.setDisabled(true);
				}
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

		// Default Agent field
		new Setting(contentEl)
			.setName("Default agent (optional)")
			.setDesc("Default value for <agent> placeholder")
			.addText(text => text
				.setPlaceholder("Agent name")
				.setValue(this.command.defaultAgent || "")
				.onChange(value => {
					this.isDirty = true;
					this.command.defaultAgent = value;
				}));

		// Enabled toggle
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

		// Buttons
		const buttonContainer = contentEl.createDiv({cls: "modal-button-container"});

		const cancelButton = buttonContainer.createEl("button", {text: "Cancel"});
		cancelButton.addEventListener("click", () => {
			void this.handleCloseRequest();
		});

		const saveButton = buttonContainer.createEl("button", {
			text: "Save",
			cls: "mod-cta"
		});
		saveButton.addEventListener("click", () => {
			void this.save();
		});
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
				"Close anyway",
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
