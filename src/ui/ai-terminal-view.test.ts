import {beforeEach, describe, expect, it, vi} from "vitest";
import {JSDOM} from "jsdom";

const terminalInstances: any[] = [];

class TerminalMock {
	cols = 80;
	rows = 24;
	open = vi.fn();
	write = vi.fn();
	clear = vi.fn();
	dispose = vi.fn();
	loadAddon = vi.fn();
	private onDataCallback?: (data: string) => void;

	onData(callback: (data: string) => void): void {
		this.onDataCallback = callback;
	}

	emitData(data: string): void {
		this.onDataCallback?.(data);
	}
}

class FitAddonMock {
	fit = vi.fn();
}

vi.mock("@xterm/xterm", () => ({
	Terminal: vi.fn(() => {
		const instance = new TerminalMock();
		terminalInstances.push(instance);
		return instance;
	})
}));

vi.mock("@xterm/addon-fit", () => ({
	FitAddon: vi.fn(() => new FitAddonMock())
}));

const spawnMock = vi.fn();

vi.mock("node-pty", () => ({
	spawn: (...args: any[]) => spawnMock(...args)
}));

import {WorkspaceLeaf} from "obsidian";
import {AITerminalView} from "./ai-terminal-view";
import * as pty from "node-pty";

describe("AITerminalView", () => {
	beforeEach(() => {
		const dom = new JSDOM("<!doctype html><html><body></body></html>");
		(globalThis as any).window = dom.window;
		(globalThis as any).document = dom.window.document;
		(globalThis as any).HTMLElement = dom.window.HTMLElement;
		terminalInstances.length = 0;
		spawnMock.mockReset();
	});

	it("starts PTY shell and resizes with terminal", async () => {
		const leaf = new WorkspaceLeaf();
		const view = new AITerminalView(leaf);
		const resizeCallbacks: Array<() => void> = [];
		const ptyProcess = {
			write: vi.fn(),
			resize: vi.fn(),
			onData: vi.fn(),
			onExit: vi.fn(),
			kill: vi.fn()
		};

		spawnMock.mockReturnValue(ptyProcess);
		(view as any).registerEvent = vi.fn();
		(view as any).app.workspace.on = vi.fn((_event: string, callback: () => void) => {
			resizeCallbacks.push(callback);
			return {off: vi.fn()};
		});

		const wrapper = document.createElement("div");
		wrapper.appendChild(document.createElement("div"));
		const container = document.createElement("div") as any;
		container.empty = vi.fn(() => {
			container.innerHTML = "";
		});
		container.addClass = vi.fn();
		container.createDiv = vi.fn((cls: string) => {
			const div = document.createElement("div");
			if (cls) div.className = cls;
			container.appendChild(div);
			return div;
		});
		wrapper.appendChild(container);
		(view as any).containerEl = wrapper;

		await view.onOpen();

		expect(pty.spawn).toHaveBeenCalled();
		const spawnArgs = spawnMock.mock.calls[0];
		const options = spawnArgs?.[2];
		expect(options.cols).toBe(80);
		expect(options.rows).toBe(24);

		const terminal = terminalInstances[0];
		terminal.emitData("ls");
		expect(ptyProcess.write).toHaveBeenCalledWith("ls");

		resizeCallbacks[0]?.();
		expect(ptyProcess.resize).toHaveBeenCalledWith(80, 24);
	});

	it("writes commands via PTY", () => {
		const leaf = new WorkspaceLeaf();
		const view = new AITerminalView(leaf);
		const ptyProcess = {
			write: vi.fn(),
			resize: vi.fn(),
			onData: vi.fn(),
			onExit: vi.fn(),
			kill: vi.fn()
		};
		(view as any).ptyProcess = ptyProcess;

		view.executeCommand("echo hello");

		expect(ptyProcess.write).toHaveBeenCalledWith("echo hello\r\n");
	});
});
