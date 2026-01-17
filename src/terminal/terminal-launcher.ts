import {App, Notice} from "obsidian";
import {AI_TERMINAL_VIEW_TYPE} from "../ui/ai-terminal-view";
import type {AITerminalView} from "../ui/ai-terminal-view";
import {PlatformType, TerminalMode} from "../types";

// Use require for Node.js builtin to avoid import restrictions
const {spawn} = require("child_process") as { spawn: typeof import("child_process").spawn };

/**
 * Platform-specific terminal launcher
 */
export class TerminalLauncher {
	constructor(private app: App) {}

	/**
	 * Launch terminal with command
	 */
	async launch(
		terminalMode: TerminalMode,
		terminalType: PlatformType,
		command: string,
		workingDir: string
	): Promise<void> {
		if (terminalMode === "embedded") {
			await this.launchEmbeddedTerminal(command, workingDir);
			return;
		}

		try {
			await this.launchWindowsTerminal(command, workingDir);
		} catch (error) {
			this.handleLaunchError(error);
			throw error;
		}
	}

	private handleLaunchError(error: unknown): void {
		const message = error instanceof Error ? error.message : String(error);
		new Notice(`Failed to launch terminal: ${message}`);
		console.error("Terminal launch error:", error);
	}

	private async launchEmbeddedTerminal(command: string, workingDir: string): Promise<void> {
		const leaf = this.getOrCreateEmbeddedLeaf();
		if (!leaf) {
			new Notice("Unable to open AI Terminal view.");
			return;
		}

		await leaf.setViewState({type: AI_TERMINAL_VIEW_TYPE, active: true});
		this.app.workspace.revealLeaf(leaf);

		const view = this.getEmbeddedView(leaf);
		if (!view) {
			new Notice("AI Terminal view is not ready yet.");
			return;
		}

		const combinedCommand = this.buildEmbeddedCommand(command, workingDir);
		view.executeCommand(combinedCommand);
	}

	private getOrCreateEmbeddedLeaf() {
		const existingLeaves = this.app.workspace.getLeavesOfType(AI_TERMINAL_VIEW_TYPE);
		return existingLeaves[0] ?? this.app.workspace.getRightLeaf(false);
	}

	private getEmbeddedView(leaf: { view: unknown }): AITerminalView | null {
		const view = leaf.view as Partial<AITerminalView> | null;
		if (view && typeof view.executeCommand === "function") {
			return view as AITerminalView;
		}
		return null;
	}

	private buildEmbeddedCommand(command: string, workingDir: string): string {
		const newline = this.getEmbeddedNewline();
		const normalizedCommand = this.normalizeCommand(command).replace(/\n/g, newline);
		const hasCommand = normalizedCommand.length > 0;
		if (!workingDir.trim()) {
			return normalizedCommand;
		}

		if (process.platform === "win32") {
			const escapedDir = workingDir.replace(/'/g, "''");
			const setLocation = `Set-Location -Path '${escapedDir}'`;
			return hasCommand ? `${setLocation}${newline}${normalizedCommand}` : setLocation;
		}

		const quotedDir = `\"${workingDir.replace(/\"/g, '\\\\\"')}\"`;
		const changeDir = `cd ${quotedDir}`;
		return hasCommand ? `${changeDir}${newline}${normalizedCommand}` : changeDir;
	}

	private normalizeCommand(command: string): string {
		return command.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
	}

	private getEmbeddedNewline(): string {
		return process.platform === "win32" ? "\r\n" : "\n";
	}

	/**
	 * Encode command as Base64 for PowerShell -EncodedCommand
	 * PowerShell expects UTF-16LE encoding
	 */
	private encodeCommandForPowerShell(command: string): string {
		// PowerShell -EncodedCommand requires UTF-16LE base64
		const buffer = Buffer.from(command, "utf16le");
		return buffer.toString("base64");
	}

	/**
	 * Wrap a PowerShell script with Set-Location to ensure correct working directory
	 */
	private wrapPowerShellScript(script: string, workingDir: string): string {
		const escapedWorkingDir = workingDir.replace(/'/g, "''");
		return `Set-Location '${escapedWorkingDir}'\n${script}`;
	}

	/**
	 * Launch Windows Terminal
	 */
	private async launchWindowsTerminal(command: string, workingDir: string): Promise<void> {
		try {
			// Use Base64 encoding to avoid all escaping issues
			const script = this.wrapPowerShellScript(command, workingDir);
			const encodedCommand = this.encodeCommandForPowerShell(script);

			const args = [
				"-d", workingDir,
				"powershell", "-NoExit", "-EncodedCommand", encodedCommand
			];

			console.log("[AI Terminal] Launching Windows Terminal:");
			console.log("  Working dir:", workingDir);
			console.log("  Command:", command);
			// console.log("  Encoded (Base64):", encodedCommand);

			spawn("wt.exe", args, {
				detached: true,
				stdio: "ignore"
			}).unref();
		} catch {
			throw new Error("Windows Terminal not found. Please install Windows Terminal or use a different terminal type.");
		}
	}
}
