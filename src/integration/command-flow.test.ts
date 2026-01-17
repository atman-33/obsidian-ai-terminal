// @vitest-environment jsdom
import {beforeEach, describe, expect, it, vi} from "vitest";

const launchSpy = vi.fn();
const resolveForPowerShellSpy = vi.fn(() => "resolved-command");
const getWorkingDirectorySpy = vi.fn(() => "/tmp");
const requiresFileContextSpy = vi.fn(() => false);

vi.mock("../terminal/terminal-launcher", () => ({
	TerminalLauncher: class {
		launch = launchSpy;
	}
}));

vi.mock("../placeholders/placeholder-resolver", () => ({
	PlaceholderResolver: class {
		constructor() {}
		resolveForPowerShell = resolveForPowerShellSpy;
		getWorkingDirectory = getWorkingDirectorySpy;
		requiresFileContext = requiresFileContextSpy;
	}
}));

import AITerminalPlugin from "../main";
import {CommandExecutor} from "../commands/command-executor";
import {CommandEditorModal} from "../ui/command-editor";
import {DirectPromptModal} from "../ui/direct-prompt-modal";
import {Menu, Modal, TFile, Vault} from "obsidian";
import {AgentConfig, AITerminalSettings, CommandTemplate} from "../types";

function createPlugin(overrides: Partial<AITerminalSettings> = {}): AITerminalPlugin {
	const mockApp = {vault: new Vault(), workspace: {on: () => ({})}} as any;
	const mockManifest = {} as any;
	const plugin = new AITerminalPlugin(mockApp, mockManifest);
	(plugin as any).app = mockApp;
	(plugin as any).settings = {
		terminalType: "windows-terminal",
		terminalMode: "external",
		agents: [],
		commands: [],
		settingsVersion: 1,
		rememberLastPrompt: false,
		lastSavedPrompt: "",
		...overrides
	};
	(plugin as any).saveSettings = vi.fn().mockResolvedValue(undefined);
	(plugin as any).reregisterCommands = vi.fn();
	(plugin as any).commandManager = {getEnabledCommands: () => []};
	(plugin as any).commandExecutor = new CommandExecutor(plugin);
	return plugin;
}

beforeEach(() => {
	launchSpy.mockClear();
	resolveForPowerShellSpy.mockClear();
	getWorkingDirectorySpy.mockClear();
	requiresFileContextSpy.mockClear();
});

describe("integration command flow", () => {
	it("runs full direct prompt flow from menu to terminal launch", async () => {
		const plugin = createPlugin({
			agents: [{name: "noctis", enabled: true}],
			lastUsedDirectPromptCommand: "opencode --agent <agent> --prompt <prompt>",
			lastUsedDirectPromptAgent: "noctis"
		});

		const menu = new Menu();
		const file = new TFile();
		file.name = "note.md";
		file.path = "note.md";

		let lastModal: DirectPromptModal | undefined;
		const originalOpen = Modal.prototype.open;
		const openSpy = vi.spyOn(Modal.prototype, "open").mockImplementation(function (this: any) {
			lastModal = this as DirectPromptModal;
			return originalOpen.call(this);
		});

		(plugin as any).addCommandsToMenu(menu, file, "selected text");
	expect((menu as any).items.length).toBeGreaterThan(0);

	(menu as any).items[0]?.trigger();
		expect(lastModal).toBeInstanceOf(DirectPromptModal);
		(lastModal as any).promptText = "Explain the selection";

		const executeButton = lastModal?.contentEl.querySelector("button.mod-cta") as HTMLButtonElement;
		expect(executeButton).toBeTruthy();
		executeButton.click();

		await new Promise(resolve => setTimeout(resolve, 0));

		expect(resolveForPowerShellSpy).toHaveBeenCalled();
		expect(launchSpy).toHaveBeenCalledWith(
			plugin.settings.terminalMode,
			plugin.settings.terminalType,
			"resolved-command",
			"/tmp"
		);

		openSpy.mockRestore();
	});

	it("populates the agent dropdown in the direct prompt modal", () => {
		const agents: AgentConfig[] = [
			{name: "noctis", enabled: true},
			{name: "ignis", enabled: true},
			{name: "prompto", enabled: false}
		];
		const plugin = createPlugin({agents});

		const modal = new DirectPromptModal(plugin.app as any, plugin);
		modal.open();

		const select = modal.contentEl.querySelector("select") as HTMLSelectElement;
		expect(select).toBeTruthy();
		const options = Array.from(select.options).map(option => option.value);
		expect(options).toEqual(["noctis", "ignis"]);
	});

	it("populates the agent dropdown in the command editor modal", () => {
		const agents: AgentConfig[] = [
			{name: "noctis", enabled: true},
			{name: "ignis", enabled: true},
			{name: "prompto", enabled: false}
		];
		const modal = new CommandEditorModal(
			{vault: new Vault(), workspace: {on: () => ({})}} as any,
			null,
			agents,
			async () => {}
		);
		modal.open();

		const select = modal.contentEl.querySelector("select") as HTMLSelectElement;
		expect(select).toBeTruthy();
		const options = Array.from(select.options).map(option => option.value);
		expect(options).toEqual(["noctis", "ignis"]);
	});

	it("executes template with agent lookup and launches terminal", async () => {
		const plugin = createPlugin({
			agents: [{name: "ignis", enabled: true}]
		});
		const executor = new CommandExecutor(plugin);
		const command: CommandTemplate = {
			id: "cmd-1",
			name: "Run",
			template: "opencode --agent <agent> -i <prompt>",
			defaultPrompt: "Review <file>",
			agentName: "ignis",
			enabled: true
		};

		const success = await executor.executeCommand(command, {prompt: "custom prompt"});

		expect(success).toBe(true);
		expect(resolveForPowerShellSpy).toHaveBeenCalledWith(
			"opencode --agent <agent> -i <prompt>",
			expect.objectContaining({agent: "ignis", prompt: "custom prompt"}),
			expect.objectContaining({
				defaultPrompt: "Review <file>",
				agentCommand: "ignis"
			})
		);
		expect(launchSpy).toHaveBeenCalledWith(
			plugin.settings.terminalMode,
			plugin.settings.terminalType,
			"resolved-command",
			"/tmp"
		);
	});
});
