import {describe, it, expect, vi} from "vitest";
import {createDefaultSettings, loadSettings, resetSettingsToDefaults} from "./settings";
import {AITerminalSettings} from "./types";

describe("settings loading", () => {
	it("returns defaults without reset on first install", () => {
		const {settings, wasReset} = loadSettings({});
		expect(wasReset).toBe(false);
		expect(settings).toEqual(createDefaultSettings());
	});

	it("resets settings when UUID structure is missing", () => {
		const legacySettings = {
			terminalType: "windows-terminal",
			agents: [
				{
					name: "Noctis",
					enabled: true
				}
			],
			commands: [
				{
					id: "legacy",
					name: "Legacy command",
					template: "copilot --agent <agent> -i <prompt>",
					enabled: true
				}
			]
		} as any;

		const {settings, wasReset} = loadSettings(legacySettings);
		expect(wasReset).toBe(true);
		expect(settings).toEqual(createDefaultSettings());
	});

	it("keeps settings with valid UUID structure", () => {
		const defaults = createDefaultSettings();
		const {settings, wasReset} = loadSettings(defaults);
		expect(wasReset).toBe(false);
		expect(settings.agents).toEqual(defaults.agents);
		expect(settings.commands).toEqual(defaults.commands);
	});

	it("preserves UUID settings across version updates", () => {
		const defaults = createDefaultSettings();
		const olderVersion = {
			...defaults,
			settingsVersion: defaults.settingsVersion - 1
		};

		const {settings, wasReset} = loadSettings(olderVersion);
		expect(wasReset).toBe(false);
		expect(settings.settingsVersion).toBe(createDefaultSettings().settingsVersion);
	});

	it("resets settings with invalid UUID structure", () => {
		const defaults = createDefaultSettings();
		const invalid = {
			...defaults,
			agents: [
				{
					id: defaults.agents[0]?.id ?? "test-id",
					name: "",
					enabled: true
				}
			]
		};

		const {settings, wasReset} = loadSettings(invalid);
		expect(wasReset).toBe(true);
		expect(settings).toEqual(createDefaultSettings());
	});

	it("regenerates UUIDs when format is invalid but references can be remapped", () => {
		const defaults = createDefaultSettings();
		const firstAgent = defaults.agents[0];
		const firstCommand = defaults.commands[0];
		
		if (!firstAgent || !firstCommand) {
			throw new Error("Default settings must have at least one agent and command");
		}
		
		const invalid = {
			...defaults,
			agents: [
				{
					...firstAgent,
					id: "not-a-uuid"
				}
			],
			commands: [
				{
					...firstCommand,
					agentId: "not-a-uuid"
				}
			]
		};

		const {settings, wasReset, didUpdate} = loadSettings(invalid);
		expect(wasReset).toBe(false);
		expect(didUpdate).toBe(true);
		expect(settings.agents[0]?.id).not.toBe("not-a-uuid");
		expect(settings.commands[0]?.agentId).toBe(settings.agents[0]?.id);
	});
});

describe("settings reset", () => {
	it("restores defaults and saves settings", async () => {
		const defaults = createDefaultSettings();
		const plugin = {
			settings: {
				...defaults,
				terminalType: "windows-terminal",
				agents: [],
				commands: [],
				rememberLastPrompt: true,
				lastSavedPrompt: "Keep this"
			} as AITerminalSettings,
			saveSettings: vi.fn(async () => {})
		};

		await resetSettingsToDefaults(plugin);

		expect(plugin.settings).toEqual(createDefaultSettings());
		expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
	});
});
