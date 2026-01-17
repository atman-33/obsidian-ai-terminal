import {describe, expect, it, vi} from "vitest";

vi.mock("child_process", () => ({
	spawn: vi.fn(() => ({
		unref: vi.fn()
	}))
}));

import {spawn} from "child_process";
import {TerminalLauncher} from "./terminal-launcher";


describe("TerminalLauncher", () => {
	it("opens embedded terminal view and executes command", async () => {
		const executeCommand = vi.fn();
		const leaf = {
			view: {executeCommand},
			setViewState: vi.fn(async () => {
				leaf.view = {executeCommand};
			})
		};
		const workspace = {
			getLeavesOfType: vi.fn(() => []),
			getRightLeaf: vi.fn(() => leaf),
			revealLeaf: vi.fn()
		};
		const app = {workspace} as any;
		const launcher = new TerminalLauncher(app);

		await launcher.launch("embedded", "windows-terminal", "echo hello", "/tmp");

		expect(workspace.getRightLeaf).toHaveBeenCalledWith(false);
		expect(leaf.setViewState).toHaveBeenCalledWith({type: "ai-terminal-view", active: true});
		expect(executeCommand).toHaveBeenCalled();
		expect(executeCommand.mock.calls[0]?.[0]).toContain("echo hello");
	});

	it("launches external terminal when mode is external", async () => {
		const app = {workspace: {}} as any;
		const launcher = new TerminalLauncher(app);
		const spawnMock = spawn as unknown as ReturnType<typeof vi.fn>;

		await launcher.launch("external", "windows-terminal", "echo hi", "/tmp");

		expect(spawnMock).toHaveBeenCalled();
		expect(spawnMock.mock.calls[0]?.[0]).toBe("wt.exe");
	});
});
