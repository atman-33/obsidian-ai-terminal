import {Platform} from "obsidian";

/**
 * Detect current platform
 */
export function detectPlatform(): "windows" | "linux" | "macos" {
	if (Platform.isWin) return "windows";
	if (Platform.isMacOS) return "macos";
	return "linux";
}

/**
 * Convert Windows path to WSL path
 * Example: C:\Users\name\file.txt -> /mnt/c/Users/name/file.txt
 */
export function convertToWSLPath(windowsPath: string): string {
	// Match drive letter (e.g., C:\)
	const driveMatch = windowsPath.match(/^([A-Za-z]):\\/);
	
	if (driveMatch && driveMatch[1]) {
		const driveLetter = driveMatch[1].toLowerCase();
		const restPath = windowsPath.substring(3).replace(/\\/g, "/");
		return `/mnt/${driveLetter}/${restPath}`;
	}

	// If no drive letter, just replace backslashes
	return windowsPath.replace(/\\/g, "/");
}

/**
 * Escape path for shell usage
 */
export function escapePathForShell(path: string): string {
	// For spaces and special characters
	if (path.includes(" ") || /[&|;<>()$`\\"]/.test(path)) {
		return `"${path.replace(/"/g, '\\"')}"`;
	}
	return path;
}
