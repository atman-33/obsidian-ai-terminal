import {describe, it, expect, vi} from "vitest";
import {createDefaultSettings, migrateSettings, resetSettingsToDefaults} from "./settings";
import {AITerminalSettings} from "./types";

describe("settings migration", () => {
	it("migrates legacy defaultAgent to agentName and creates agent entries", () => {
		// Using 'any' to allow legacy structure with defaultAgent
		const legacySettings = {
			terminalType: "windows-terminal",
			commands: [
				{
					id: "legacy",
					name: "Legacy command",
					template: "copilot --agent <agent> -i <prompt>",
					defaultPrompt: "Review <file>",
					defaultAgent: "noctis",
					enabled: true
				}
			]
		} as any;

		const migrated = migrateSettings(legacySettings);
		expect(migrated.agents.some(agent => agent.name === "noctis")).toBe(true);
		expect(migrated.commands[0]?.agentName).toBe("noctis");
		expect(migrated.settingsVersion).toBeGreaterThan(0);
	});
});

describe("settings reset", () => {
	it("includes terminal mode in defaults", () => {
		const defaults = createDefaultSettings();
		expect(defaults.terminalMode).toBe("external");
	});

	it("restores defaults and saves settings", async () => {
		const defaults = createDefaultSettings();
		const plugin = {
			settings: {
				...defaults,
				terminalType: "windows-terminal",
				terminalMode: "external",
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
