import {App, Modal, Notice, Setting, TFile} from "obsidian";
import AITerminalPlugin from "../main";
import {AgentConfig, CommandTemplate} from "../types";
import {CommandExecutor} from "../commands/command-executor";
import {ContextCollector} from "../placeholders/context-collector";
import {buildDirectPromptCommand} from "./direct-prompt-utils";

export class DirectPromptModal extends Modal {
	private commandExecutor: CommandExecutor;
	private contextCollector: ContextCollector;
	private commandTemplate = "";
	private selectedAgentName = "";
	private promptText = "";
	private promptTextArea?: HTMLTextAreaElement;
	private selectedText?: string;

	constructor(
		app: App,
		private plugin: AITerminalPlugin,
		private file?: TFile,
		selection?: string
	) {
		super(app);
		this.selectedText = selection;
		this.commandTemplate = plugin.settings.lastUsedDirectPromptCommand ?? "<agent> -i <prompt>";
		this.commandExecutor = new CommandExecutor(plugin);
		this.contextCollector = new ContextCollector(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", {text: "Direct prompt"});

		this.promptText = this.getInitialPromptText();

		const enabledAgents = this.getEnabledAgents();
		this.selectedAgentName = this.plugin.settings.lastUsedDirectPromptAgent ?? enabledAgents[0]?.name ?? "";

		// Command template field
		const commandSetting = new Setting(contentEl)
			.setName("Command")
			.setDesc("Command template with placeholders (<agent>, <prompt>, etc.)")
			.addText(text => {
				text
					.setPlaceholder("opencode --agent <agent> --prompt <prompt>")
					.setValue(this.commandTemplate)
					.onChange(value => {
						this.commandTemplate = value;
					});
				text.inputEl.setCssProps({ width: "100%" });
			});
		commandSetting.settingEl.addClass("ai-terminal-vertical-field");

		const agentSetting = new Setting(contentEl)
			.setName("Agent")
			.setDesc("Select an AI agent to use for this prompt")
			.addDropdown(dropdown => {
				enabledAgents.forEach(agent => {
					dropdown.addOption(agent.name, agent.name);
				});
				dropdown.setValue(this.selectedAgentName);
				dropdown.setDisabled(enabledAgents.length === 0);
				dropdown.onChange(value => {
					this.selectedAgentName = value;
				});
			});

		if (enabledAgents.length === 0) {
			agentSetting.setDesc("Please configure at least one AI agent in settings.");
		}

		const promptSetting = new Setting(contentEl)
			.setName("Prompt")
			.setDesc("")
			.addTextArea(text => {
				text
					.setPlaceholder("Enter your prompt here...")
					.setValue(this.promptText)
					.onChange(value => {
						this.promptText = value;
					});
				text.inputEl.rows = 6;
				text.inputEl.setCssProps({ width: "100%" });
				this.promptTextArea = text.inputEl;
			});
		promptSetting.settingEl.addClass("ai-terminal-vertical-field");

		const placeholderNames = ["file", "path", "relative-path", "dir", "vault", "selection"];
		this.buildPlaceholderDescription(promptSetting.descEl, placeholderNames);

		const buttonContainer = contentEl.createDiv({cls: "modal-button-container"});
		const cancelButton = buttonContainer.createEl("button", {text: "Cancel"});
		cancelButton.addEventListener("click", () => this.close());

		const executeButton = buttonContainer.createEl("button", {
			text: "Execute",
			cls: "mod-cta"
		});
		if (enabledAgents.length === 0) {
			executeButton.disabled = true;
			executeButton.title = "No enabled agents found. Please configure agents in settings.";
		}
		executeButton.addEventListener("click", () => {
			void this.executePrompt(enabledAgents);
		});

		this.focusPromptTextArea();
	}

	private getInitialPromptText(): string {
		if (!this.plugin.settings.rememberLastPrompt) {
			return "";
		}
		return this.plugin.settings.lastSavedPrompt ?? "";
	}

	private buildPlaceholderDescription(descEl: HTMLElement, placeholderNames: string[]): void {
		const safeDescEl = descEl as HTMLElement & {
			createEl?: (tag: string, options?: {text?: string; cls?: string}) => HTMLElement;
			appendText?: (text: string) => void;
			empty?: () => void;
		};

		safeDescEl.empty?.();
		safeDescEl.appendText?.("Available placeholders: ");
		placeholderNames.forEach((placeholder, index) => {
			const link = safeDescEl.createEl?.("a", {
				text: `<${placeholder}>`,
				cls: "ai-terminal-placeholder-link"
			});
			link?.addEventListener("click", event => {
				event.preventDefault();
				// Save cursor position before focus is lost
				const textarea = this.promptTextArea;
				const savedStart = textarea?.selectionStart ?? null;
				const savedEnd = textarea?.selectionEnd ?? null;
				this.insertPlaceholderValue(placeholder, savedStart, savedEnd);
			});
			if (index < placeholderNames.length - 1) {
				safeDescEl.appendText?.(", ");
			}
		});
	}

	private focusPromptTextArea(): void {
		const textarea = this.promptTextArea;
		if (!textarea) {
			return;
		}
		textarea.focus();
		const length = textarea.value.length;
		textarea.selectionStart = length;
		textarea.selectionEnd = length;
	}

	private getEnabledAgents(): AgentConfig[] {
		return this.plugin.settings.agents.filter(agent => agent.enabled);
	}

	private async executePrompt(enabledAgents: AgentConfig[]): Promise<void> {
		const agent = enabledAgents.find(current => current.name === this.selectedAgentName);
		if (!agent) {
			new Notice("Please configure at least one AI agent in settings.");
			return;
		}

		const {template, promptValue} = buildDirectPromptCommand(
			this.commandTemplate,
			agent.name,
			this.promptText
		);

		await this.persistDirectPromptSettings();

		const directCommand: CommandTemplate = {
			id: "direct-prompt",
			name: "Direct Prompt",
			template,
			defaultPrompt: promptValue,
			agentName: agent.name,
			enabled: true
		};

		const success = await this.commandExecutor.executeCommand(directCommand, {
			file: this.file,
			selection: this.selectedText,
			prompt: promptValue
		});

		if (success) {
			this.close();
		}
	}

	private async persistDirectPromptSettings(): Promise<void> {
		this.plugin.settings.lastUsedDirectPromptCommand = this.commandTemplate;
		this.plugin.settings.lastUsedDirectPromptAgent = this.selectedAgentName;
		if (this.plugin.settings.rememberLastPrompt) {
			this.plugin.settings.lastSavedPrompt = this.promptText;
		}
		await this.plugin.saveSettings();
	}

	private insertPlaceholderValue(placeholder: string, savedStart: number | null = null, savedEnd: number | null = null): void {
		const value = this.resolvePlaceholderValue(placeholder);
		this.insertAtCursor(value, savedStart, savedEnd);
	}

	private resolvePlaceholderValue(placeholder: string): string {
		switch (placeholder) {
			case "file":
				return this.file?.name ?? "";
			case "path":
				return this.file ? this.contextCollector.getFilePath(this.file) : "";
			case "relative-path":
				return this.file ? this.contextCollector.getRelativePath(this.file) : "";
			case "dir":
				return this.file ? this.contextCollector.getDirectoryPath(this.file) : "";
			case "vault":
				return this.contextCollector.getVaultPath();
			case "selection":
				return this.selectedText ?? "";
			default:
				return "";
		}
	}

	private insertAtCursor(value: string, savedStart: number | null = null, savedEnd: number | null = null): void {
		const textarea = this.promptTextArea;
		if (!textarea) {
			return;
		}

		const text = textarea.value;
		const hasFocus = document.activeElement === textarea;
		
		// Use saved cursor position if provided, otherwise use current position
		const start = savedStart !== null ? savedStart : textarea.selectionStart;
		const end = savedEnd !== null ? savedEnd : textarea.selectionEnd;
		const canUseSelection = (savedStart !== null || hasFocus) && start !== null && end !== null;

		if (!canUseSelection) {
			const shouldAddSpace = value.length > 0 && text.length > 0 && !/\s$/.test(text);
			const nextValue = text + (shouldAddSpace ? " " : "") + value;
			this.updatePromptText(textarea, nextValue, nextValue.length);
			return;
		}

		const before = text.slice(0, start);
		const after = text.slice(end);
		const nextValue = `${before}${value}${after}`;
		const cursorPos = before.length + value.length;
		this.updatePromptText(textarea, nextValue, cursorPos);
	}

	private updatePromptText(textarea: HTMLTextAreaElement, nextValue: string, cursorPos: number): void {
		textarea.value = nextValue;
		this.promptText = nextValue;
		textarea.selectionStart = cursorPos;
		textarea.selectionEnd = cursorPos;
		textarea.focus();
	}
}
