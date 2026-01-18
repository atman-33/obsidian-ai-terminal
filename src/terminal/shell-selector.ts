import {PlatformType} from "../types";

export type ShellType = "powershell" | "bash";

/**
 * Resolve the shell type used for placeholder escaping.
 *
 * @param terminalType Configured terminal type from settings.
 * @param platform Runtime platform override for testing.
 * @returns Shell type to use for escaping rules.
 */
export function resolveShellType(
	terminalType: PlatformType,
	platform: NodeJS.Platform = process.platform
): ShellType {
	if (terminalType === "bash") {
		return "bash";
	}

	if (platform === "win32") {
		return "powershell";
	}

	return "bash";
}