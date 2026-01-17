import {App, Modal, Notice, PluginSettingTab, Setting} from "obsidian";
import AITerminalPlugin from "./main";
import {AgentConfig, AITerminalSettings, CommandTemplate, PlatformType, AVAILABLE_PLACEHOLDERS} from "./types";
import {CommandEditorModal} from "./ui/command-editor";
import {CommandManager} from "./commands/command-manager";
import {AgentListEditor} from "./ui/agent-list-editor";
import {generateUUID} from "./utils/uuid";

const SETTINGS_VERSION = 3;

const DEFAULT_AGENTS: AgentConfig[] = [
	{
		name: "Build",
		enabled: true
	},
	{
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
			agentName: "Build",
			enabled: true
		},
		{
			id: "b7e2a3c4-5d6f-4a8b-9c12-34567890efab",
			name: "Copilot - Review",
			template: 'copilot --agent <agent> -i <prompt>',
			defaultPrompt: "Review <file>",
			agentName: "Agent",
			enabled: true
		}
 	],
	settingsVersion: SETTINGS_VERSION,
	lastUsedDirectPromptCommand: "opencode --agent <agent> --prompt <prompt>",
	lastUsedDirectPromptAgent: "Build",
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

type LegacyCommandTemplate = Omit<CommandTemplate, "agentName"> & { defaultAgent?: string; agentId?: string; agentName?: string };

function createUniqueAgentName(base: string, existing: Set<string>): string {
	const trimmed = base.trim();
	const baseName = trimmed.length > 0 ? trimmed : "agent";
	let candidate = baseName;
	let suffix = 1;
	while (existing.has(normalizeAgentMatch(candidate))) {
		candidate = `${baseName}-${suffix}`;
		suffix += 1;
	}
	existing.add(normalizeAgentMatch(candidate));
	return candidate;
}

function normalizeAgentMatch(value: string): string {
	return value.trim().toLowerCase();
}

function isValidUUID(id: string): boolean {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return uuidRegex.test(id);
}

export function migrateSettings(
	settings: Partial<AITerminalSettings> & { commands?: LegacyCommandTemplate[] }
): AITerminalSettings {
	const base: AITerminalSettings = {
		...DEFAULT_SETTINGS,
		...settings,
		settingsVersion: SETTINGS_VERSION
	};

	if (settings.agents && settings.agents.length > 0 && settings.settingsVersion !== undefined && settings.settingsVersion >= SETTINGS_VERSION) {
		return base;
	}

	const legacyCommands = (settings.commands ?? DEFAULT_SETTINGS.commands) as LegacyCommandTemplate[];
	const rawAgents = settings.agents && settings.agents.length > 0
		? settings.agents
		: DEFAULT_AGENTS.map(agent => ({...agent}));
	const existingNames = new Set<string>();
	const agentsByMatch = new Map<string, AgentConfig>();
	const agents: AgentConfig[] = [];

	rawAgents.forEach(agent => {
		const legacyAgent = agent as AgentConfig & { id?: string; command?: string };
		const candidate = legacyAgent.command?.trim() || legacyAgent.name?.trim() || legacyAgent.id?.trim() || "";
		if (!candidate) {
			return;
		}
		const name = createUniqueAgentName(candidate, existingNames);
		const normalizedName = normalizeAgentMatch(name);
		const mapped: AgentConfig = {
			name,
			enabled: legacyAgent.enabled ?? true
		};
		agents.push(mapped);
		agentsByMatch.set(normalizedName, mapped);
		if (legacyAgent.id) {
			agentsByMatch.set(normalizeAgentMatch(legacyAgent.id), mapped);
		}
		if (legacyAgent.name) {
			agentsByMatch.set(normalizeAgentMatch(legacyAgent.name), mapped);
		}
		if (legacyAgent.command) {
			agentsByMatch.set(normalizeAgentMatch(legacyAgent.command), mapped);
		}
	});

	const migratedCommands = legacyCommands.map(command => {
		const legacyAgent = command.defaultAgent?.trim();
		let agentName = command.agentName ?? command.agentId;
		if (!agentName) {
			if (legacyAgent) {
				const match = agentsByMatch.get(normalizeAgentMatch(legacyAgent));
				if (match) {
					agentName = match.name;
				} else {
					const name = createUniqueAgentName(legacyAgent, existingNames);
					const newAgent: AgentConfig = {
						name,
						enabled: true
					};
					agents.push(newAgent);
					agentsByMatch.set(normalizeAgentMatch(newAgent.name), newAgent);
					agentName = newAgent.name;
				}
			} else {
				agentName = agents[0]?.name ?? "copilot";
			}
		}

		const {defaultAgent, agentId, ...rest} = command as LegacyCommandTemplate;
		const migratedCommand = {
			...rest,
			agentName
		} as CommandTemplate;
		
		// Migrate non-UUID IDs to UUID
		if (!isValidUUID(migratedCommand.id)) {
			migratedCommand.id = generateUUID();
		}
		
		return migratedCommand;
	});

	return {
		...base,
		agents,
		commands: migratedCommands,
		settingsVersion: SETTINGS_VERSION
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
