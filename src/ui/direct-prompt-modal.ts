import {App, Modal, Notice, Setting, TFile} from "obsidian";
import AITerminalPlugin from "../main";
import {AgentConfig, CommandTemplate} from "../types";
import {CommandExecutor} from "../commands/command-executor";
import {ContextCollector} from "../placeholders/context-collector";
import {buildContextDisplay, buildDirectPromptCommand} from "./direct-prompt-utils";

export class DirectPromptModal extends Modal {
	private commandExecutor: CommandExecutor;
	private contextCollector: ContextCollector;
	private commandTemplate = "";
	private selectedAgentName = "";
	private promptText = "";
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
			.setDesc("Available placeholders: <file>, <path>, <relative-path>, <dir>, <vault>, <selection>")
			.addTextArea(text => {
				text
					.setPlaceholder("Explain the context above...")
					.setValue(this.promptText)
					.onChange(value => {
						this.promptText = value;
					});
				text.inputEl.rows = 6;
				text.inputEl.setCssProps({ width: "100%" });
			});
		promptSetting.settingEl.addClass("ai-terminal-vertical-field");

		const buttonContainer = contentEl.createDiv({cls: "modal-button-container"});
		const cancelButton = buttonContainer.createEl("button", {text: "Cancel"});
		cancelButton.addEventListener("click", () => this.close());

		const executeButton = buttonContainer.createEl("button", {
			text: "Execute",
			cls: "mod-cta"
		});
		executeButton.disabled = enabledAgents.length === 0;
		executeButton.addEventListener("click", () => {
			void this.executePrompt(enabledAgents);
		});

		promptSetting.settingEl.querySelector("textarea")?.focus();
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

		// Save last used values
		this.plugin.settings.lastUsedDirectPromptCommand = this.commandTemplate;
		this.plugin.settings.lastUsedDirectPromptAgent = this.selectedAgentName;
		await this.plugin.saveSettings();

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
}
