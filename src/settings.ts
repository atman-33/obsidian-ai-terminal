import {App, Modal, Notice, PluginSettingTab, Setting} from "obsidian";
import AITerminalPlugin from "./main";
import {AgentConfig, AITerminalSettings, CommandTemplate, PlatformType, AVAILABLE_PLACEHOLDERS} from "./types";
import {CommandEditorModal} from "./ui/command-editor";
import {CommandManager} from "./commands/command-manager";
import {AgentListEditor} from "./ui/agent-list-editor";
import {generateUUID} from "./utils/uuid";

const SETTINGS_VERSION = 4;

const DEFAULT_AGENTS: AgentConfig[] = [
	{
		id: "00000000-0000-4000-8000-000000000001",
		name: "Build",
		enabled: true
	},
	{
		id: "00000000-0000-4000-8000-000000000002",
		name: "Agent",
		enabled: true
	}
];

export const DEFAULT_SETTINGS: AITerminalSettings = {
	terminalType: "windows-terminal",
	agents: DEFAULT_AGENTS.map(agent => ({...agent})),
	commands: [
		{
			id: "a3d5f891-2c4b-4e9a-b123-456789abcdef",
			name: "OpenCode - Fix Issues",
			template: 'opencode --agent <agent> --prompt <prompt>',
			defaultPrompt: "Fix issues in <file>",
			agentId: "00000000-0000-4000-8000-000000000001",
			enabled: true
		},
		{
			id: "b7e2a3c4-5d6f-4a8b-9c12-34567890efab",
			name: "Copilot - Review",
			template: 'copilot --agent <agent> -i <prompt>',
			defaultPrompt: "Review <file>",
			agentId: "00000000-0000-4000-8000-000000000002",
			enabled: true
		}
 	],
	settingsVersion: SETTINGS_VERSION,
	lastUsedDirectPromptCommand: "opencode --agent <agent> --prompt <prompt>",
	lastUsedDirectPromptAgentId: "00000000-0000-4000-8000-000000000001",
	rememberLastPrompt: false,
	lastSavedPrompt: ""
};

export function createDefaultSettings(): AITerminalSettings {
	return {
		...DEFAULT_SETTINGS,
		agents: DEFAULT_AGENTS.map(agent => ({...agent})),
		commands: DEFAULT_SETTINGS.commands.map(command => ({...command}))
	};
}

export async function resetSettingsToDefaults(plugin: {settings: AITerminalSettings; saveSettings: () => Promise<void>}): Promise<void> {
	plugin.settings = createDefaultSettings();
	await plugin.saveSettings();
}

function isValidUUID(id: string): boolean {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(id);
}

export function loadSettings(settings: Partial<AITerminalSettings>): {settings: AITerminalSettings; wasReset: boolean; didUpdate: boolean} {
	if (!settings || Object.keys(settings).length === 0) {
		return {settings: createDefaultSettings(), wasReset: false, didUpdate: false};
	}

	const agents = Array.isArray(settings.agents) ? settings.agents : [];
	const commands = Array.isArray(settings.commands) ? settings.commands : [];
	const hasUUIDStructure = Array.isArray(settings.agents)
		&& Array.isArray(settings.commands)
		&& agents.every(agent => agent.id && typeof agent.id === "string")
		&& commands.every(command => command.agentId && typeof command.agentId === "string");

	if (!hasUUIDStructure) {
		console.warn("Legacy settings detected (pre-UUID structure). Resetting to defaults.");
		return {settings: createDefaultSettings(), wasReset: true, didUpdate: false};
	}

	let didUpdate = false;
	const regeneratedIds = new Map<string, string>();
	const usedIds = new Set<string>();
	const normalizedAgents = agents.map(agent => {
		let id = agent.id;
		const hasValidId = typeof id === "string" && isValidUUID(id);
		const isDuplicate = hasValidId && usedIds.has(id);
		if (!hasValidId || isDuplicate) {
			const reason = !hasValidId ? "Invalid" : "Duplicate";
			console.warn(`${reason} agent UUID detected (${String(id)}). Regenerating UUID.`);
			const newId = generateUUID();
			if (!hasValidId) {
				regeneratedIds.set(id, newId);
			}
			id = newId;
			didUpdate = true;
		}
		usedIds.add(id);
		return {...agent, id};
	});

	const normalizedCommands = commands.map(command => {
		const updatedAgentId = regeneratedIds.get(command.agentId) ?? command.agentId;
		if (updatedAgentId !== command.agentId) {
			didUpdate = true;
		}
		return {...command, agentId: updatedAgentId};
	});

	const hasValidAgents = normalizedAgents.every(agent =>
		typeof agent.id === "string"
		&& isValidUUID(agent.id)
		&& typeof agent.name === "string"
		&& agent.name.trim().length > 0
		&& typeof agent.enabled === "boolean"
	);
	const hasValidCommands = normalizedCommands.every(command =>
		typeof command.id === "string"
		&& isValidUUID(command.id)
		&& typeof command.name === "string"
		&& typeof command.template === "string"
		&& typeof command.enabled === "boolean"
		&& typeof command.agentId === "string"
		&& isValidUUID(command.agentId)
	);

	if (!hasValidAgents || !hasValidCommands) {
		console.warn("Invalid settings structure detected. Resetting to defaults.");
		return {settings: createDefaultSettings(), wasReset: true, didUpdate: false};
	}

	return {
		settings: {
			...DEFAULT_SETTINGS,
			...settings,
			agents: normalizedAgents,
			commands: normalizedCommands,
			settingsVersion: SETTINGS_VERSION
		},
		wasReset: false,
		didUpdate
	};
}

export class AITerminalSettingTab extends PluginSettingTab {
	plugin: AITerminalPlugin;
	private commandManager: CommandManager;
	private agentListEditor: AgentListEditor;

	constructor(app: App, plugin: AITerminalPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.commandManager = new CommandManager(plugin);
		this.agentListEditor = new AgentListEditor(app, plugin);
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
				.setValue(this.plugin.settings.terminalType)
				.onChange(async (value: PlatformType) => {
					this.plugin.settings.terminalType = value;
					await this.plugin.saveSettings();
				}));

		// Agent List Section
		this.agentListEditor.render(containerEl, () => this.display());

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
						this.plugin.settings.agents,
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
							this.plugin.settings.agents,
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

		// Direct Prompt Section
		new Setting(containerEl)
			.setName("Direct prompt")
			.setHeading();

		new Setting(containerEl)
			.setName("Remember last prompt")
			.setDesc("Store and restore the last direct prompt text (opt-in)")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.rememberLastPrompt)
				.onChange(async (value: boolean) => {
				this.plugin.settings.rememberLastPrompt = value;
				await this.plugin.saveSettings();
				}));

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

		// Reset Settings
		containerEl.createEl("hr");
		new Setting(containerEl)
			.setName("Reset all settings")
			.setDesc("Restore all agents, commands, and preferences to their defaults")
			.addButton(button => button
				.setButtonText("Reset all settings")
				.setWarning()
				.onClick(() => {
					const modal = new ResetSettingsModal(
						this.app,
						async () => {
							await resetSettingsToDefaults(this.plugin);
							new Notice("Settings reset to defaults.");
							this.display();
						},
						() => {
							// no-op
						}
					);
					modal.open();
				}));
	}
}

class ResetSettingsModal extends Modal {
	private didResolve = false;

	constructor(
		app: App,
		private onConfirm: () => void,
		private onCancel: () => void
	) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", {text: "Reset all settings?"});
		contentEl.createEl("p", {text: "This will restore all settings to defaults and cannot be undone."});

		const list = contentEl.createEl("ul");
		list.createEl("li", {text: "All AI agents (restored to default presets)"});
		list.createEl("li", {text: "All command templates (restored to the default two templates)"});
		list.createEl("li", {text: "All preferences (terminal type, prompt persistence, and more)"});

		const buttonContainer = contentEl.createDiv({cls: "modal-button-container"});
		const cancelButton = buttonContainer.createEl("button", {text: "Cancel"});
		cancelButton.addEventListener("click", () => this.resolveAction(this.onCancel));

		const confirmButton = buttonContainer.createEl("button", {
			text: "Reset",
			cls: "mod-warning"
		});
		confirmButton.addEventListener("click", () => this.resolveAction(this.onConfirm));

		cancelButton.focus();
	}

	onClose() {
		if (!this.didResolve) {
			this.onCancel();
		}
		this.contentEl.empty();
	}

	private resolveAction(action: () => void): void {
		this.didResolve = true;
		action();
		this.close();
	}
}
