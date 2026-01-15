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
					this.command.name = value;
				}));

		// Template field
		new Setting(contentEl)
			.setName("Command template")
			.setDesc("Command with placeholders (e.g., copilot -i <prompt>)")
			.addTextArea(text => {
				text
					.setPlaceholder('copilot -i <prompt>')
					.setValue(this.command.template || "")
					.onChange(value => {
						this.command.template = value;
					});
				text.inputEl.rows = 3;
				text.inputEl.setCssProps({ width: "100%" });
			});

		// Default Prompt field
		new Setting(contentEl)
			.setName("Default prompt (optional)")
			.setDesc("Default value for <prompt> placeholder")
			.addTextArea(text => {
				text
					.setPlaceholder("Fix issues in <file>")
					.setValue(this.command.defaultPrompt || "")
					.onChange(value => {
						this.command.defaultPrompt = value;
					});
				text.inputEl.rows = 2;
				text.inputEl.setCssProps({ width: "100%" });
			});

		// Default Agent field
		new Setting(contentEl)
			.setName("Default agent (optional)")
			.setDesc("Default value for <agent> placeholder")
			.addText(text => text
				.setPlaceholder("Agent name")
				.setValue(this.command.defaultAgent || "")
				.onChange(value => {
					this.command.defaultAgent = value;
				}));

		// Enabled toggle
		new Setting(contentEl)
			.setName("Enabled")
			.setDesc("Whether this command is active")
			.addToggle(toggle => toggle
				.setValue(this.command.enabled ?? true)
				.onChange(value => {
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
		cancelButton.addEventListener("click", () => this.close());

		const saveButton = buttonContainer.createEl("button", {
			text: "Save",
			cls: "mod-cta"
		});
		saveButton.addEventListener("click", () => {
			void this.save();
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
			this.close();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Error: ${message}`);
		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
