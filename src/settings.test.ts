import {describe, it, expect} from "vitest";
import {migrateSettings} from "./settings";
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
