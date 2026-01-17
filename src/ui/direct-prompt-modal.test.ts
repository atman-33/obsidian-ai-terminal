import {beforeEach, describe, expect, it, vi} from "vitest";
import {JSDOM} from "jsdom";
import {App, TFile} from "obsidian";
import {DirectPromptModal} from "./direct-prompt-modal";
import {createDefaultSettings} from "../settings";

const setupDom = () => {
	const dom = new JSDOM("<!doctype html><html><body></body></html>");
	(globalThis as any).window = dom.window;
	(globalThis as any).document = dom.window.document;
	(globalThis as any).HTMLElement = dom.window.HTMLElement;
	(globalThis as any).Event = dom.window.Event;
};

const createPlugin = () => {
	const app = new App() as any;
	app.vault.adapter = {
		getBasePath: () => "/vault"
	};
	const settings = createDefaultSettings();
	settings.agents = [{name: "Build", enabled: true}];
	return {
		app,
		settings,
		saveSettings: vi.fn(async () => {})
	};
};

describe("DirectPromptModal", () => {
	beforeEach(() => {
		setupDom();
	});

	it("loads saved prompt when rememberLastPrompt is enabled", () => {
		const plugin = createPlugin();
		plugin.settings.rememberLastPrompt = true;
		plugin.settings.lastSavedPrompt = "Review this code";

		const modal = new DirectPromptModal(plugin.app, plugin as any);
		modal.onOpen();

		const textarea = modal.contentEl.querySelector("textarea") as HTMLTextAreaElement;
		expect(textarea.value).toBe("Review this code");
		expect(textarea.selectionStart).toBe(textarea.value.length);
		expect(textarea.selectionEnd).toBe(textarea.value.length);
	});

	it("saves prompt text when rememberLastPrompt is enabled", async () => {
		const plugin = createPlugin();
		plugin.settings.rememberLastPrompt = true;

		const modal = new DirectPromptModal(plugin.app, plugin as any);
		(modal as any).promptText = "Fix the bug";
		(modal as any).selectedAgentName = "Build";
		(modal as any).commandTemplate = "<agent> -i <prompt>";
		(modal as any).commandExecutor = { executeCommand: vi.fn(async () => true) };

		await (modal as any).executePrompt([{name: "Build", enabled: true}]);

		expect(plugin.settings.lastSavedPrompt).toBe("Fix the bug");
		expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
	});

	it("inserts placeholder value at cursor position", () => {
		const plugin = createPlugin();
		const modal = new DirectPromptModal(plugin.app, plugin as any);

		const textarea = document.createElement("textarea");
		textarea.value = "Check ";
		document.body.appendChild(textarea);
		textarea.focus();
		textarea.selectionStart = 6;
		textarea.selectionEnd = 6;

		(modal as any).promptTextArea = textarea;
		(modal as any).insertAtCursor("2026-01-17.md");

		expect(textarea.value).toBe("Check 2026-01-17.md");
		expect(textarea.selectionStart).toBe("Check 2026-01-17.md".length);
	});

	it("inserts at end with space when textarea is not focused", () => {
		const plugin = createPlugin();
		const modal = new DirectPromptModal(plugin.app, plugin as any);

		const textarea = document.createElement("textarea");
		textarea.value = "Review";
		document.body.appendChild(textarea);

		(modal as any).promptTextArea = textarea;
		(modal as any).insertAtCursor("/vault/Notes/today.md");

		expect(textarea.value).toBe("Review /vault/Notes/today.md");
	});

	it("resolves placeholders using context collector and selection", () => {
		const plugin = createPlugin();
		const file = new TFile();
		file.name = "2026-01-17.md";
		file.path = "Notes/2026-01-17.md";

		const modal = new DirectPromptModal(plugin.app, plugin as any, file, "function foo() {}");

		expect((modal as any).resolvePlaceholderValue("file")).toBe("2026-01-17.md");
		expect((modal as any).resolvePlaceholderValue("relative-path")).toBe("Notes/2026-01-17.md");
		expect((modal as any).resolvePlaceholderValue("vault")).toBe("/vault");
		expect((modal as any).resolvePlaceholderValue("selection")).toBe("function foo() {}");
	});
});
