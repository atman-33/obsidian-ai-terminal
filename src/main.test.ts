import {describe, expect, it, vi} from "vitest";
import {App} from "obsidian";
import AITerminalPlugin from "./main";

describe("AITerminalPlugin settings load", () => {
	it("shows a notice when settings are reset", async () => {
		const plugin = new AITerminalPlugin(new App() as any, {} as any);
		const legacySettings = {
			agents: [{name: "Legacy", enabled: true}],
			commands: [
				{
					id: "legacy",
					name: "Legacy command",
					template: "copilot -i <prompt>",
					enabled: true
				}
			]
		} as any;

		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const saveSpy = vi.spyOn(plugin, "saveData").mockResolvedValue(undefined);
		vi.spyOn(plugin, "loadData").mockResolvedValue(legacySettings);

		await plugin.loadSettings();

		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				"Notice: AI Terminal: Settings were reset to defaults due to UUID migration. Please reconfigure your agents and commands."
			)
		);
		expect(saveSpy).toHaveBeenCalled();

		logSpy.mockRestore();
		saveSpy.mockRestore();
	});
});
