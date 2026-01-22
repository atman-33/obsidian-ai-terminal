// @vitest-environment jsdom
import {beforeEach, describe, expect, it, vi} from "vitest";

const launchSpy = vi.fn();
const resolveForShellSpy = vi.fn(() => "resolved-command");
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
		resolveForShell = resolveForShellSpy;
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
		agents: [],
		commands: [],
		settingsVersion: 4,
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

const getDirectPromptTextarea = (modal: DirectPromptModal): HTMLTextAreaElement => {
	const textarea = modal.contentEl.querySelector("textarea");
	if (!textarea) {
		throw new Error("Prompt textarea not found.");
	}
	return textarea as HTMLTextAreaElement;
};

const getDirectPromptExecuteButton = (modal: DirectPromptModal): HTMLButtonElement => {
	const executeButton = modal.contentEl.querySelector("button.mod-cta");
	if (!executeButton) {
		throw new Error("Execute button not found.");
	}
	return executeButton as HTMLButtonElement;
};

const setPromptValue = (textarea: HTMLTextAreaElement, value: string): void => {
	textarea.value = value;
	textarea.dispatchEvent(new Event("input", { bubbles: true }));
};

const flushPromises = async (): Promise<void> => {
	await new Promise(resolve => setTimeout(resolve, 0));
};

beforeEach(() => {
	launchSpy.mockClear();
	resolveForShellSpy.mockClear();
	getWorkingDirectorySpy.mockClear();
	requiresFileContextSpy.mockClear();
});

describe("integration command flow", () => {
	it("runs full direct prompt flow from menu to terminal launch", async () => {
		const plugin = createPlugin({
			agents: [{id: "00000000-0000-4000-8000-000000000010", name: "noctis", enabled: true}],
			lastUsedDirectPromptCommand: "opencode --agent <agent> --prompt <prompt>",
			lastUsedDirectPromptAgentId: "00000000-0000-4000-8000-000000000010"
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

		const modal = lastModal as DirectPromptModal;
		const textarea = getDirectPromptTextarea(modal);
		setPromptValue(textarea, "Explain the selection");

		const executeButton = getDirectPromptExecuteButton(modal);
		expect(executeButton.disabled).toBe(false);
		executeButton.click();

		await flushPromises();

		expect(resolveForShellSpy).toHaveBeenCalled();
		expect(launchSpy).toHaveBeenCalledWith(
			plugin.settings.terminalType,
			"resolved-command",
			"/tmp"
		);

		openSpy.mockRestore();
	});

	it("populates the agent dropdown in the direct prompt modal", () => {
		const agents: AgentConfig[] = [
			{id: "00000000-0000-4000-8000-000000000010", name: "noctis", enabled: true},
			{id: "00000000-0000-4000-8000-000000000011", name: "ignis", enabled: true},
			{id: "00000000-0000-4000-8000-000000000012", name: "prompto", enabled: false}
		];
		const plugin = createPlugin({agents});

		const modal = new DirectPromptModal(plugin.app as any, plugin);
		modal.open();

		const select = modal.contentEl.querySelector("select") as HTMLSelectElement;
		expect(select).toBeTruthy();
		const options = Array.from(select.options).map(option => option.value);
		expect(options).toEqual([
			"00000000-0000-4000-8000-000000000010",
			"00000000-0000-4000-8000-000000000011"
		]);
	});

	it("populates the agent dropdown in the command editor modal", () => {
		const agents: AgentConfig[] = [
			{id: "00000000-0000-4000-8000-000000000010", name: "noctis", enabled: true},
			{id: "00000000-0000-4000-8000-000000000011", name: "ignis", enabled: true},
			{id: "00000000-0000-4000-8000-000000000012", name: "prompto", enabled: false}
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
		expect(options).toEqual([
			"00000000-0000-4000-8000-000000000010",
			"00000000-0000-4000-8000-000000000011"
		]);
	});

	it("executes template with agent lookup and launches terminal", async () => {
		const plugin = createPlugin({
			agents: [{id: "00000000-0000-4000-8000-000000000011", name: "ignis", enabled: true}]
		});
		const executor = new CommandExecutor(plugin);
		const command: CommandTemplate = {
			id: "cmd-1",
			name: "Run",
			template: "opencode --agent <agent> -i <prompt>",
			defaultPrompt: "Review <file>",
			agentId: "00000000-0000-4000-8000-000000000011",
			enabled: true
		};

		const success = await executor.executeCommand(command, {prompt: "custom prompt"});

		expect(success).toBe(true);
		const expectedShell = process.platform === "win32" ? "powershell" : "bash";
		expect(resolveForShellSpy).toHaveBeenCalledWith(
			"opencode --agent <agent> -i <prompt>",
			expect.objectContaining({agent: "ignis", prompt: "custom prompt"}),
			expect.objectContaining({
				defaultPrompt: "Review <file>",
				agentCommand: "ignis"
			}),
			expectedShell
		);
		expect(launchSpy).toHaveBeenCalledWith(
			plugin.settings.terminalType,
			"resolved-command",
			"/tmp"
		);
	});

	it("uses updated agent name without changing command template", async () => {
		const plugin = createPlugin({
			agents: [{id: "00000000-0000-4000-8000-000000000099", name: "old", enabled: true}]
		});
		const executor = new CommandExecutor(plugin);
		const command: CommandTemplate = {
			id: "cmd-rename",
			name: "Run",
			template: "opencode --agent <agent> -i <prompt>",
			defaultPrompt: "Review <file>",
			agentId: "00000000-0000-4000-8000-000000000099",
			enabled: true
		};

		const agent = plugin.settings.agents[0];
		if (agent) {
			agent.name = "new";
		}
		const success = await executor.executeCommand(command, {prompt: "custom prompt"});

		expect(success).toBe(true);
		const expectedShell = process.platform === "win32" ? "powershell" : "bash";
		expect(resolveForShellSpy).toHaveBeenCalledWith(
			"opencode --agent <agent> -i <prompt>",
			expect.objectContaining({agent: "new", prompt: "custom prompt"}),
			expect.objectContaining({
				defaultPrompt: "Review <file>",
				agentCommand: "new"
			}),
			expectedShell
		);
	});
});
