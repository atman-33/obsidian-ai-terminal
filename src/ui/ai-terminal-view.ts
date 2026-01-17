import { ItemView, WorkspaceLeaf } from "obsidian";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import * as pty from "node-pty";
import "@xterm/xterm/css/xterm.css";

export const AI_TERMINAL_VIEW_TYPE = "ai-terminal-view";

export class AITerminalView extends ItemView {
	private terminal: Terminal;
	private fitAddon: FitAddon;
	private ptyProcess: pty.IPty | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.terminal = new Terminal({
			cursorBlink: true,
			fontSize: 14,
			fontFamily: 'Consolas, "Courier New", monospace',
		});
		this.fitAddon = new FitAddon();
		this.terminal.loadAddon(this.fitAddon);
	}

	getViewType(): string {
		return AI_TERMINAL_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "AI Terminal";
	}

	getIcon(): string {
		return "terminal";
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement;
		if (!container) return;
		
		container.empty();
		container.addClass("ai-terminal-container");

		const terminalEl = container.createDiv("ai-terminal");
		this.terminal.open(terminalEl);
		this.fitAddon.fit();

		// Start shell process
		this.startShell();

		// Handle terminal input
		this.terminal.onData((data) => {
			this.ptyProcess?.write(data);
		});

		// Handle resize
		this.registerEvent(
			this.app.workspace.on("resize", () => {
				this.fitAddon.fit();
				this.ptyProcess?.resize(this.terminal.cols, this.terminal.rows);
			})
		);
	}

	private startShell(): void {
		const shell = process.platform === "win32" ? "powershell.exe" : "bash";
		const shellArgs = process.platform === "win32" ? ["-NoLogo"] : [];

		this.ptyProcess = pty.spawn(shell, shellArgs, {
			cwd: process.cwd(),
			env: process.env,
			cols: this.terminal.cols,
			rows: this.terminal.rows,
		});

		this.ptyProcess.onData((data) => {
			this.terminal.write(data);
		});

		this.ptyProcess.onExit(({exitCode}) => {
			this.terminal.write(`\r\nProcess exited with code ${exitCode}\r\n`);
		});
	}

	public executeCommand(command: string): void {
		this.ptyProcess?.write(`${command}\r\n`);
	}

	public clearTerminal(): void {
		this.terminal.clear();
	}

	async onClose(): Promise<void> {
		if (this.ptyProcess) {
			this.ptyProcess.kill();
			this.ptyProcess = null;
		}
		this.terminal.dispose();
	}
}
