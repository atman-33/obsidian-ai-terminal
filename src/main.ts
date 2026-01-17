import {Plugin, TFile, Menu, Editor, MarkdownView} from 'obsidian';
import {AITerminalSettingTab, migrateSettings} from "./settings";
import {AITerminalSettings} from "./types";
import {CommandManager} from "./commands/command-manager";
import {CommandExecutor} from "./commands/command-executor";
import {DirectPromptModal} from "./ui/direct-prompt-modal";
import {AITerminalView, AI_TERMINAL_VIEW_TYPE} from "./ui/ai-terminal-view";

export default class AITerminalPlugin extends Plugin {
	settings: AITerminalSettings;
	private commandManager: CommandManager;
	private commandExecutor: CommandExecutor;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.commandManager = new CommandManager(this);
		this.commandExecutor = new CommandExecutor(this);

		this.registerView(AI_TERMINAL_VIEW_TYPE, (leaf) => new AITerminalView(leaf));
		this.addSettingTab(new AITerminalSettingTab(this.app, this));

		this.registerCommands();
		this.registerContextMenus();
	}

	onunload(): void {
		// Cleanup handled automatically by Obsidian
	}

	async loadSettings(): Promise<void> {
		const rawSettings = await this.loadData() as Partial<AITerminalSettings> | null;
		this.settings = migrateSettings(rawSettings ?? {});
		if (!rawSettings || !rawSettings.agents || !rawSettings.settingsVersion) {
			await this.saveData(this.settings);
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.reregisterCommands();
	}

	/**
	 * Register all enabled commands in command palette
	 */
	private registerCommands(): void {
		const enabledCommands = this.commandManager.getEnabledCommands();

		this.addCommand({
			id: "open-ai-terminal",
			name: "Open AI Terminal",
			callback: () => {
				void this.openTerminalView();
			}
		});

		this.addCommand({
			id: "direct-prompt",
			name: "Direct prompt",
			callback: () => {
				this.openDirectPromptModal(this.getActiveFile(), undefined);
			}
		});

		enabledCommands.forEach(cmd => {
			this.addCommand({
				id: `ai-terminal-${cmd.id}`,
				name: `AI Terminal: ${cmd.name}`,
				callback: () => {
					this.executeTemplateCommand(cmd, this.getActiveFile(), undefined);
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
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file: TFile) => {
				this.addCommandsToMenu(menu, file, undefined);
			})
		);

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

		menu.addSeparator();
		menu.addItem(item => {
			item
				.setTitle("Direct prompt...")
				.setIcon("edit")
				.onClick(() => {
					menu.hide();
					this.openDirectPromptModal(file ?? undefined, selection);
				});
		});

		if (enabledCommands.length === 0) {
			return;
		}

		menu.addSeparator();
		enabledCommands.forEach(cmd => {
			menu.addItem(item => {
				item
					.setTitle(`AI Terminal: ${cmd.name}`)
					.setIcon("terminal")
					.onClick(() => {
						menu.hide();
						this.executeTemplateCommand(cmd, file ?? undefined, selection);
					});
			});
		});
	}

	private executeTemplateCommand(
		command: Parameters<CommandExecutor["executeCommand"]>[0],
		file?: TFile,
		selection?: string
	): void {
		void this.commandExecutor.executeCommand(command, {
			file,
			selection: selection || undefined,
			vault: this.app.vault
		});
	}

	private getActiveFile(): TFile | undefined {
		return this.app.workspace.getActiveFile() ?? undefined;
	}

	private async openTerminalView(): Promise<void> {
		const leaf = this.app.workspace.getRightLeaf(false);
		if (!leaf) {
			return;
		}
		await leaf.setViewState({type: AI_TERMINAL_VIEW_TYPE, active: true});
		this.app.workspace.revealLeaf(leaf);
	}

	private openDirectPromptModal(file?: TFile, selection?: string): void {
		const modal = new DirectPromptModal(this.app, this, file, selection);
		modal.open();
	}
}
