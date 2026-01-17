import {App, Modal, Notice, PluginSettingTab, Setting} from "obsidian";
import AITerminalPlugin from "./main";
import {AgentConfig, AITerminalSettings, CommandTemplate, PlatformType, TerminalMode, AVAILABLE_PLACEHOLDERS} from "./types";
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
	terminalMode: "external",
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

	const isCurrentVersion = !!(
		settings.agents &&
		settings.agents.length > 0 &&
		settings.settingsVersion !== undefined &&
		settings.settingsVersion >= SETTINGS_VERSION
	);
	if (isCurrentVersion) {
		return base;
	}

	const legacyCommands = (settings.commands ?? DEFAULT_SETTINGS.commands) as LegacyCommandTemplate[];
	const rawAgents = settings.agents && settings.agents.length > 0
		? settings.agents
		: DEFAULT_AGENTS.map(agent => ({...agent}));
	const existingNames = new Set<string>();
	const {agents, agentsByMatch} = buildAgentMappings(rawAgents, existingNames);

	const migratedCommands = legacyCommands.map(command => {
		const agentName = resolveAgentName(command, agents, agentsByMatch, existingNames);
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

	function buildAgentMappings(inputAgents: AgentConfig[], existing: Set<string>): {
		agents: AgentConfig[];
		agentsByMatch: Map<string, AgentConfig>;
	} {
		const mappedAgents: AgentConfig[] = [];
		const mappedAgentsByMatch = new Map<string, AgentConfig>();

		inputAgents.forEach(agent => {
			const legacyAgent = agent as AgentConfig & { id?: string; command?: string };
			const candidate = legacyAgent.command?.trim()
				|| legacyAgent.name?.trim()
				|| legacyAgent.id?.trim()
				|| "";
			if (!candidate) {
				return;
			}

			const name = createUniqueAgentName(candidate, existing);
			const normalizedName = normalizeAgentMatch(name);
			const mapped: AgentConfig = {
				name,
				enabled: legacyAgent.enabled ?? true
			};
			mappedAgents.push(mapped);
			mappedAgentsByMatch.set(normalizedName, mapped);

			if (legacyAgent.id) {
				mappedAgentsByMatch.set(normalizeAgentMatch(legacyAgent.id), mapped);
			}
			if (legacyAgent.name) {
				mappedAgentsByMatch.set(normalizeAgentMatch(legacyAgent.name), mapped);
			}
			if (legacyAgent.command) {
				mappedAgentsByMatch.set(normalizeAgentMatch(legacyAgent.command), mapped);
			}
		});

		return {agents: mappedAgents, agentsByMatch: mappedAgentsByMatch};
	}

	function resolveAgentName(
		command: LegacyCommandTemplate,
		agentsList: AgentConfig[],
		agentsLookup: Map<string, AgentConfig>,
		existing: Set<string>
	): string {
		const legacyAgent = command.defaultAgent?.trim();
		let agentName = command.agentName ?? command.agentId;
		if (agentName) {
			return agentName;
		}

		if (legacyAgent) {
			const match = agentsLookup.get(normalizeAgentMatch(legacyAgent));
			if (match) {
				return match.name;
			}

			const name = createUniqueAgentName(legacyAgent, existing);
			const newAgent: AgentConfig = {
				name,
				enabled: true
			};
			agentsList.push(newAgent);
			agentsLookup.set(normalizeAgentMatch(newAgent.name), newAgent);
			return newAgent.name;
		}

		return agentsList[0]?.name ?? "copilot";
	}
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

		this.renderTerminalSection(containerEl);
		this.agentListEditor.render(containerEl, () => this.refresh());
		this.renderCommandTemplatesSection(containerEl);
		this.renderDirectPromptSection(containerEl);
		this.renderPlaceholderReference(containerEl);
		this.renderResetSection(containerEl);
	}

	private renderTerminalSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Terminal configuration")
			.setHeading();

		new Setting(containerEl)
			.setName("Terminal mode")
			.setDesc("Choose between embedded or external terminal")
			.addDropdown(dropdown => dropdown
				.addOption("external", "External terminal")
				.addOption("embedded", "Embedded terminal")
				.setValue(this.plugin.settings.terminalMode)
				.onChange(async (value: TerminalMode) => {
					this.plugin.settings.terminalMode = value;
					await this.plugin.saveSettings();
				}));

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
	}

	private renderCommandTemplatesSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Command templates")
			.setHeading();

		containerEl.createEl("p", {
			text: "Define custom commands to launch AI agents with specific prompts and arguments.",
			cls: "setting-item-description"
		});

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
							this.refresh();
						}
					);
					modal.open();
				}));

		const commands = this.commandManager.getAllCommands();
		if (commands.length === 0) {
			containerEl.createEl("p", {
				text: "No command templates configured yet. Click 'add command' to create one.",
				cls: "setting-item-description"
			});
			return;
		}

		this.renderCommandList(containerEl, commands);
	}

	private renderCommandList(containerEl: HTMLElement, commands: CommandTemplate[]): void {
		commands.forEach((command, index) => {
			const setting = new Setting(containerEl)
				.setName(command.name)
				.setDesc(`ID: ${command.id} | Template: ${command.template.substring(0, 50)}${command.template.length > 50 ? "..." : ""}`);

			setting.addToggle(toggle => toggle
				.setValue(command.enabled)
				.onChange(async () => {
					await this.commandManager.toggleCommand(command.id);
					this.refresh();
				}));

			setting.addButton(button => button
				.setButtonText("Edit")
				.onClick(() => {
					const modal = new CommandEditorModal(
						this.app,
						{...command},
						this.plugin.settings.agents,
						async (updated) => {
							await this.commandManager.updateCommand(command.id, updated);
							this.refresh();
						}
					);
					modal.open();
				}));

			if (index > 0) {
				setting.addButton(button => button
					.setIcon("up-chevron-glyph")
					.setTooltip("Move up")
					.onClick(async () => {
						await this.commandManager.moveCommandUp(command.id);
						this.refresh();
					}));
			}

			if (index < commands.length - 1) {
				setting.addButton(button => button
					.setIcon("down-chevron-glyph")
					.setTooltip("Move down")
					.onClick(async () => {
						await this.commandManager.moveCommandDown(command.id);
						this.refresh();
					}));
			}

			setting.addButton(button => button
				.setIcon("trash")
				.setTooltip("Remove")
				.setWarning()
				.onClick(async () => {
					await this.commandManager.removeCommand(command.id);
					this.refresh();
				}));
		});
	}

	private renderDirectPromptSection(containerEl: HTMLElement): void {
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
	}

	private renderPlaceholderReference(containerEl: HTMLElement): void {
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

	private renderResetSection(containerEl: HTMLElement): void {
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
							this.refresh();
						},
						() => {
							// no-op
						}
					);
					modal.open();
				}));
	}

	private refresh(): void {
		this.display();
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
