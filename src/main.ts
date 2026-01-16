import {Plugin, TFile, Menu, Editor, MarkdownView} from 'obsidian';
import {AITerminalSettingTab, migrateSettings} from "./settings";
import {AITerminalSettings} from "./types";
import {CommandManager} from "./commands/command-manager";
import {CommandExecutor} from "./commands/command-executor";
import {DirectPromptModal} from "./ui/direct-prompt-modal";

export default class AITerminalPlugin extends Plugin {
	settings: AITerminalSettings;
	private commandManager: CommandManager;
	private commandExecutor: CommandExecutor;

	async onload() {
		await this.loadSettings();

		// Initialize managers
		this.commandManager = new CommandManager(this);
		this.commandExecutor = new CommandExecutor(this);

		// Register settings tab
		this.addSettingTab(new AITerminalSettingTab(this.app, this));

		// Register commands in command palette
		this.registerCommands();

		// Register context menu handlers
		this.registerContextMenus();
	}

	onunload() {
		// Cleanup handled automatically by Obsidian
	}

	async loadSettings() {
		const rawSettings = await this.loadData() as Partial<AITerminalSettings> | null;
		this.settings = migrateSettings(rawSettings ?? {});
		if (!rawSettings || !rawSettings.agents || !rawSettings.settingsVersion) {
			await this.saveData(this.settings);
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Re-register commands when settings change
		this.reregisterCommands();
	}

	/**
	 * Register all enabled commands in command palette
	 */
	private registerCommands(): void {
		const enabledCommands = this.commandManager.getEnabledCommands();

		this.addCommand({
			id: "ai-terminal-direct-prompt",
			name: "AI Terminal: Direct Prompt",
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				this.openDirectPromptModal(activeFile ?? undefined, undefined);
			}
		});

		enabledCommands.forEach(cmd => {
			this.addCommand({
				id: `ai-terminal-${cmd.id}`,
				name: `AI Terminal: ${cmd.name}`,
				callback: () => {
					const activeFile = this.app.workspace.getActiveFile();
					void this.commandExecutor.executeCommand(cmd, {
						file: activeFile ?? undefined,
						vault: this.app.vault
					});
				}
			});
		});
	}

	/**
	 * Re-register commands (called when settings change)
	 */
	private reregisterCommands(): void {
		// Obsidian doesn't provide a way to unregister commands,
		// so we rely on plugin reload for now
		// TODO: Find a better way to handle dynamic command registration
	}

	/**
	 * Register context menu handlers
	 */
	private registerContextMenus(): void {
		// File context menu (right-click on file in file explorer)
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
				this.addCommandsToMenu(menu, file, undefined);
			})
		);

		// Editor context menu (right-click in editor)
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				this.addCommandsToMenu(menu, view.file, selection);
			})
		);
	}

	/**
	 * Add command templates to a context menu
	 */
	private addCommandsToMenu(menu: Menu, file: TFile | null, selection?: string): void {
		const enabledCommands = this.commandManager.getEnabledCommands();

		// Add separator before our commands
		menu.addSeparator();

		menu.addItem(item => {
			item
				.setTitle("AI Terminal: Direct Prompt...")
				.setIcon("edit")
				.onClick(() => {
					this.openDirectPromptModal(file ?? undefined, selection);
				});
		});

		if (enabledCommands.length === 0) {
			return;
		}

		// Separator between direct prompt and templates
		menu.addSeparator();

		enabledCommands.forEach(cmd => {
			menu.addItem(item => {
				item
					.setTitle(`AI Terminal: ${cmd.name}`)
					.setIcon("terminal")
					.onClick(() => {
						void this.commandExecutor.executeCommand(cmd, {
							file: file ?? undefined,
							selection: selection || undefined,
							vault: this.app.vault
						});
					});
			});
		});
	}

	private openDirectPromptModal(file?: TFile, selection?: string): void {
		const modal = new DirectPromptModal(this.app, this, file, selection);
		modal.open();
	}
}
