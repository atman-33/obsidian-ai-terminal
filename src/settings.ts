import {App, PluginSettingTab, Setting, Platform} from "obsidian";
import AITerminalPlugin from "./main";
import {AITerminalSettings, PlatformType, AVAILABLE_PLACEHOLDERS} from "./types";
import {CommandEditorModal} from "./ui/command-editor";
import {CommandManager} from "./commands/command-manager";

/**
 * Detect platform and return appropriate default terminal type
 */
function getDefaultTerminalType(): PlatformType {
	if (Platform.isWin) {
		return "windows-terminal";
	}
	return "system";
}

export const DEFAULT_SETTINGS: AITerminalSettings = {
	terminalType: getDefaultTerminalType(),
	wslDistribution: "Ubuntu",
	commands: [
		{
			id: "copilot-interactive",
			name: "Copilot - Interactive",
			template: 'copilot -i <prompt>',
			defaultPrompt: "Fix issues in <file>",
			enabled: true
		},
		{
			id: "copilot-with-agent",
			name: "Copilot - With Agent",
			template: 'copilot --agent <agent> -i <prompt>',
			defaultPrompt: "Review <file>",
			defaultAgent: "code-reviewer",
			enabled: true
		},
		{
			id: "opencode-interactive",
			name: "OpenCode - Interactive",
			template: 'opencode --agent <agent> --prompt <prompt>',
			defaultPrompt: "Analyze <file>",
			defaultAgent: "noctis",
			enabled: true
		},
		{
			id: "opencode-simple",
			name: "OpenCode - Simple",
			template: 'opencode --prompt <prompt>',
			defaultPrompt: "Help with <file>",
			enabled: true
		},
		{
			id: "terminal-only",
			name: "Terminal Only",
			template: "bash",
			enabled: true
		}
	]
}

export class AITerminalSettingTab extends PluginSettingTab {
	plugin: AITerminalPlugin;
	private commandManager: CommandManager;

	constructor(app: App, plugin: AITerminalPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.commandManager = new CommandManager(plugin);
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Terminal configuration")
			.setHeading();

		// Terminal Type Setting
		new Setting(containerEl)
			.setName("Terminal type")
			.setDesc("Select which terminal to use when launching AI agents")
			.addDropdown(dropdown => dropdown
				.addOption("windows-terminal", "Windows terminal")
				.addOption("wsl", "Windows subsystem for Linux (wsl)")
				.addOption("system", "System default")
				.setValue(this.plugin.settings.terminalType)
				.onChange(async (value: PlatformType) => {
					this.plugin.settings.terminalType = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide WSL options
				}));

		// WSL Distribution (shown only when WSL is selected)
		if (this.plugin.settings.terminalType === "wsl") {
			new Setting(containerEl)
				.setName("Wsl distribution")
				.setDesc("Name of the wsl distribution to use (for example, ubuntu or debian)")
				.addText(text => text
					.setPlaceholder("Ubuntu")
					.setValue(this.plugin.settings.wslDistribution)
					.onChange(async (value) => {
						this.plugin.settings.wslDistribution = value;
						await this.plugin.saveSettings();
					}));
		}

		// Command Templates Section
		new Setting(containerEl)
			.setName("Command templates")
			.setHeading();
		
		containerEl.createEl("p", {
			text: "Define custom commands to launch AI agents with specific prompts and arguments.",
			cls: "setting-item-description"
		});

		// Add Command button
		new Setting(containerEl)
			.setName("Add new command")
			.setDesc("Create a new command template")
			.addButton(button => button
				.setButtonText("Add command")
				.setCta()
				.onClick(() => {
					const modal = new CommandEditorModal(
						this.app,
						null,
						async (command) => {
							await this.commandManager.addCommand(command);
							this.display(); // Refresh settings
						}
					);
					modal.open();
				}));

		// Display existing commands
		const commands = this.commandManager.getAllCommands();
		
		if (commands.length === 0) {
			containerEl.createEl("p", {
				text: "No command templates configured yet. Click 'add command' to create one.",
				cls: "setting-item-description"
			});
		} else {
			commands.forEach((command, index) => {
				const setting = new Setting(containerEl)
					.setName(command.name)
					.setDesc(`ID: ${command.id} | Template: ${command.template.substring(0, 50)}${command.template.length > 50 ? "..." : ""}`);

				// Enabled toggle
				setting.addToggle(toggle => toggle
					.setValue(command.enabled)
					.onChange(async () => {
						await this.commandManager.toggleCommand(command.id);
						this.display();
					}));

				// Edit button
				setting.addButton(button => button
					.setButtonText("Edit")
					.onClick(() => {
						const modal = new CommandEditorModal(
							this.app,
							{...command},
							async (updated) => {
								await this.commandManager.updateCommand(command.id, updated);
								this.display();
							}
						);
						modal.open();
					}));

				// Move up button
				if (index > 0) {
					setting.addButton(button => button
						.setIcon("up-chevron-glyph")
						.setTooltip("Move up")
						.onClick(async () => {
							await this.commandManager.moveCommandUp(command.id);
							this.display();
						}));
				}

				// Move down button
				if (index < commands.length - 1) {
					setting.addButton(button => button
						.setIcon("down-chevron-glyph")
						.setTooltip("Move down")
						.onClick(async () => {
							await this.commandManager.moveCommandDown(command.id);
							this.display();
						}));
				}

				// Remove button
				setting.addButton(button => button
					.setIcon("trash")
					.setTooltip("Remove")
					.setWarning()
					.onClick(async () => {
						await this.commandManager.removeCommand(command.id);
						this.display();
					}));
			});
		}

		// Placeholder Reference
		const placeholderSection = containerEl.createDiv({cls: "ai-terminal-placeholder-reference"});
		new Setting(placeholderSection)
			.setName("Available placeholders")
			.setHeading();
		const placeholderList = placeholderSection.createEl("ul");
		
		AVAILABLE_PLACEHOLDERS.forEach(placeholder => {
			const item = placeholderList.createEl("li");
			item.createEl("code", {text: `<${placeholder.name}>`});
			item.appendText(`: ${placeholder.description} `);
			item.createEl("em", {text: `(e.g., ${placeholder.example})`});
		});
	}
}
