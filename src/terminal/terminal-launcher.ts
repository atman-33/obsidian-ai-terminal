import {Notice} from "obsidian";
import {PlatformType} from "../types";
import {detectPlatform, convertToWSLPath} from "./path-converter";
import {ChildProcess} from "child_process";

// Use require for Node.js builtin to avoid import restrictions
const {spawn} = require("child_process") as { spawn: typeof import("child_process").spawn };

/**
 * Platform-specific terminal launcher
 */
export class TerminalLauncher {
	/**
	 * Launch terminal with command
	 */
	async launch(
		terminalType: PlatformType,
		command: string,
		workingDir: string,
		wslDistribution: string = "Ubuntu"
	): Promise<void> {
		try {
			const platform = detectPlatform();

			switch (terminalType) {
				case "windows-terminal":
					await this.launchWindowsTerminal(command, workingDir);
					break;
				case "wsl":
					await this.launchWSL(command, workingDir, wslDistribution);
					break;
				case "system":
					await this.launchSystemTerminal(command, workingDir, platform);
					break;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Failed to launch terminal: ${message}`);
			console.error("Terminal launch error:", error);
			throw error;
		}
	}

	/**
	 * Launch Windows Terminal
	 */
	private async launchWindowsTerminal(command: string, workingDir: string): Promise<void> {
		try {
			// Command is already escaped by escapeShell()
			// Just wrap in script block for PowerShell
			const scriptBlock = `& {${command}}`;
			
			const args = [
				"-d", workingDir,
				"powershell", "-NoExit", "-Command", scriptBlock
			];

			console.log("[AI Terminal] Launching Windows Terminal:");
			console.log("  Working dir:", workingDir);
			console.log("  Command:", command);
			console.log("  Script block:", scriptBlock);
			console.log("  Full args:", ["wt.exe", ...args]);

			spawn("wt.exe", args, {
				detached: true,
				stdio: "ignore"
			}).unref();
		} catch {
			throw new Error(`Windows Terminal not found. Please install Windows Terminal or use a different terminal type.`);
		}
	}

	/**
	 * Launch WSL terminal
	 */
	private async launchWSL(
		command: string,
		workingDir: string,
		distribution: string
	): Promise<void> {
		try {
			// Convert Windows path to WSL path
			const wslPath = convertToWSLPath(workingDir);
			
			// Build WSL command
			const wslCommand = `cd "${wslPath}" && ${command}`;
			
			console.log("[AI Terminal] Launching WSL:");
			console.log("  Windows path:", workingDir);
			console.log("  WSL path:", wslPath);
			console.log("  Command:", command);
			console.log("  Full WSL command:", wslCommand);
			
			// Launch WSL with Windows Terminal if available, otherwise use wsl.exe directly
			try {
				console.log("  Trying wt.exe with WSL...");
				// Try Windows Terminal first
				spawn("wt.exe", [
					"wsl", "-d", distribution, "--", "bash", "-c", wslCommand
				], {
					detached: true,
					stdio: "ignore"
				}).unref();
			} catch {
				// Fallback to direct wsl.exe
				spawn("wsl.exe", [
					"-d", distribution,
					"--",
					"bash", "-c", wslCommand
				], {
					detached: true,
					stdio: "ignore"
				}).unref();
			}
		} catch {
			throw new Error(`WSL not found or ${distribution} distribution not installed. Please check your WSL installation.`);
		}
	}

	/**
	 * Launch system default terminal
	 */
	private async launchSystemTerminal(
		command: string,
		workingDir: string,
		platform: "windows" | "linux" | "macos"
	): Promise<void> {
		console.log("[AI Terminal] Launching system terminal:");
		console.log("  Platform:", platform);
		console.log("  Working dir:", workingDir);
		console.log("  Command:", command);
		if (platform === "macos") {
			await this.launchMacTerminal(command, workingDir);
		} else if (platform === "linux") {
			await this.launchLinuxTerminal(command, workingDir);
		} else {
			// Windows fallback to cmd
			await this.launchWindowsCmd(command, workingDir);
		}
	}

	/**
	 * Launch macOS Terminal.app
	 */
	private async launchMacTerminal(command: string, workingDir: string): Promise<void> {
		const script = `
tell application "Terminal"
	do script "cd '${workingDir.replace(/'/g, "\\'")}' && ${command.replace(/'/g, "\\'")}"
	activate
end tell
		`.trim();

		spawn("osascript", ["-e", script], {
			detached: true,
			stdio: "ignore"
		}).unref();
	}

	/**
	 * Launch Linux terminal
	 */
	private async launchLinuxTerminal(command: string, workingDir: string): Promise<void> {
		// Try common Linux terminals in order of preference
		const terminals = [
			{cmd: "gnome-terminal", args: ["--working-directory", workingDir, "--", "bash", "-c", `${command}; exec bash`]},
			{cmd: "konsole", args: ["--workdir", workingDir, "-e", "bash", "-c", `${command}; exec bash`]},
			{cmd: "xfce4-terminal", args: ["--working-directory", workingDir, "-e", `bash -c "${command}; exec bash"`]},
			{cmd: "xterm", args: ["-e", `cd "${workingDir}" && ${command}; exec bash`]}
		];

		let launched = false;
		for (const terminal of terminals) {
			try {
				spawn(terminal.cmd, terminal.args, {
					detached: true,
					stdio: "ignore"
				}).unref();
				launched = true;
				break;
			} catch {
				// Try next terminal
				continue;
			}
		}

		if (!launched) {
			throw new Error("No supported terminal found. Please install gnome-terminal, konsole, xfce4-terminal, or xterm.");
		}
	}

	/**
	 * Launch Windows PowerShell
	 */
	private async launchWindowsCmd(command: string, workingDir: string): Promise<void> {
		// Command is already escaped by escapeShell()
		const scriptBlock = `& {Set-Location '${workingDir.replace(/'/g, "''")}'; ${command}}`;
		
		spawn("powershell.exe", [
			"-NoExit",
			"-Command",
			scriptBlock
		], {
			detached: true,
			stdio: "ignore"
		}).unref();
	}
}
