import {Notice} from "obsidian";
import {PlatformType} from "../types";
import {resolveShellType} from "./shell-selector";

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
		workingDir: string
	): Promise<void> {
		try {
			const platform = process.platform;
			if (platform === "win32" && terminalType === "windows-terminal") {
				await this.launchWindowsTerminal(command, workingDir);
				return;
			}
			await this.launchPosixShell(terminalType, command, workingDir);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Failed to launch terminal: ${message}`);
			console.error("Terminal launch error:", error);
			throw error;
		}
	}

	/**
	 * Encode command as Base64 for PowerShell -EncodedCommand
	 * PowerShell expects UTF-16LE encoding
	 */
	private encodeCommandForPowerShell(command: string): string {
		// PowerShell -EncodedCommand requires UTF-16LE base64
		const buffer = Buffer.from(command, 'utf16le');
		return buffer.toString('base64');
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
			throw new Error(`Windows Terminal not found. Please install Windows Terminal or use a different terminal type.`);
		}
	}

	private async launchPosixShell(
		terminalType: PlatformType,
		command: string,
		workingDir: string
	): Promise<void> {
		const platform = process.platform;
		const shellType = resolveShellType(terminalType, platform);
		const shell = terminalType === "bash"
			? "bash"
			: (platform === "win32" ? "powershell" : (process.env.SHELL || "sh"));
		const args = shellType === "powershell"
			? ["-NoExit", "-Command", command]
			: ["-lc", command];

		console.log("[AI Terminal] Launching shell command:");
		console.log("  Shell:", shell);
		console.log("  Working dir:", workingDir);
		console.log("  Command:", command);

		spawn(shell, args, {
			cwd: workingDir,
			detached: true,
			stdio: "ignore"
		}).unref();
	}

}
