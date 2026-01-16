import {App, PluginSettingTab, Setting} from "obsidian";
import AITerminalPlugin from "./main";
import {AgentConfig, AITerminalSettings, CommandTemplate, PlatformType, AVAILABLE_PLACEHOLDERS} from "./types";
import {CommandEditorModal} from "./ui/command-editor";
import {CommandManager} from "./commands/command-manager";
import {AgentListEditor} from "./ui/agent-list-editor";
import {generateUUID} from "./utils/uuid";

const SETTINGS_VERSION = 3;

const DEFAULT_AGENTS: AgentConfig[] = [
	{
		name: "copilot",
		enabled: true
	},
	{
		name: "opencode",
		enabled: true
	}
];

export const DEFAULT_SETTINGS: AITerminalSettings = {
	terminalType: "windows-terminal",
	agents: DEFAULT_AGENTS.map(agent => ({...agent})),
	commands: [
		{
			id: "a3d5f891-2c4b-4e9a-b123-456789abcdef",
			name: "Copilot - Interactive",
			template: '<agent> -i <prompt>',
			defaultPrompt: "Fix issues in <file>",
			agentName: "copilot",
			enabled: true
		},
		{
			id: "b7e2a3c4-5d6f-4a8b-9c12-34567890efab",
			name: "Copilot - With Agent",
			template: '<agent> --agent code-reviewer -i <prompt>',
			defaultPrompt: "Review <file>",
			agentName: "copilot",
			enabled: true
		},
		{
			id: "c1f3e5d7-8a9b-4c2d-a345-678901bcdef0",
			name: "OpenCode - Interactive",
			template: '<agent> --agent noctis --prompt <prompt>',
			defaultPrompt: "Analyze <file>",
			agentName: "opencode",
			enabled: true
		},
		{
			id: "d2e4f6a8-9b1c-4d5e-b678-901234cdef56",
			name: "OpenCode - Simple",
			template: '<agent> --prompt <prompt>',
			defaultPrompt: "Help with <file>",
			agentName: "opencode",
			enabled: true
		},
		{
			id: "e3f5a7b9-0c2d-4e6f-c789-012345def678",
			name: "Terminal Only",
			template: "bash",
			agentName: "copilot",
			enabled: true
		}
 	],
	settingsVersion: SETTINGS_VERSION
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
