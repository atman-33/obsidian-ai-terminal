import {App, Modal, Notice, Setting, TFile} from "obsidian";
import AITerminalPlugin from "../main";
import {AgentConfig, CommandTemplate} from "../types";
import {CommandExecutor} from "../commands/command-executor";
import {ContextCollector} from "../placeholders/context-collector";
import {buildContextDisplay, buildDirectPromptCommand} from "./direct-prompt-utils";

export class DirectPromptModal extends Modal {
	private commandExecutor: CommandExecutor;
	private contextCollector: ContextCollector;
	private selectedAgentName = "";
	private promptText = "";

	constructor(
		app: App,
		private plugin: AITerminalPlugin,
		private file?: TFile,
		private selection?: string
	) {
		super(app);
		this.commandExecutor = new CommandExecutor(plugin);
		this.contextCollector = new ContextCollector(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", {text: "Direct prompt"});

		const enabledAgents = this.getEnabledAgents();
		this.selectedAgentName = enabledAgents[0]?.name ?? "";

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

		const filePath = this.file ? this.contextCollector.getFilePath(this.file) : undefined;
		const contextDisplay = buildContextDisplay(filePath, this.selection);
		new Setting(contentEl)
			.setName("Context")
			.setDesc("Read-only context that will be included with your prompt")
			.addTextArea(text => {
				text.setValue(contextDisplay.displayText);
				text.inputEl.readOnly = true;
				text.inputEl.rows = 4;
				text.inputEl.setCssProps({ width: "100%" });
			});

		const promptSetting = new Setting(contentEl)
			.setName("Prompt")
			.setDesc("Enter additional instructions (optional)")
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
			void this.executePrompt(contextDisplay.promptText, enabledAgents);
		});

		promptSetting.settingEl.querySelector("textarea")?.focus();
	}

	private getEnabledAgents(): AgentConfig[] {
		return this.plugin.settings.agents.filter(agent => agent.enabled);
	}

	private async executePrompt(contextPrompt: string, enabledAgents: AgentConfig[]): Promise<void> {
		const agent = enabledAgents.find(current => current.name === this.selectedAgentName);
		if (!agent) {
			new Notice("Please configure at least one AI agent in settings.");
			return;
		}

		const {template, promptValue} = buildDirectPromptCommand(
			agent.name,
			contextPrompt,
			this.promptText
		);

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
			selection: this.selection,
			prompt: promptValue
		});

		if (success) {
			this.close();
		}
	}
}
