import { TFile, Vault } from "obsidian";

/**
 * Supported terminal types for launching
 */
export type PlatformType = "windows-terminal";

/**
 * Command template configuration for launching AI agents
 */
export interface CommandTemplate {
	/** Unique identifier (kebab-case) */
	id: string;
	
	/** Display name shown in UI */
	name: string;
	
	/** Command template with placeholders */
	template: string;
	
	/** Default prompt if <prompt> placeholder exists */
	defaultPrompt?: string;
	
	/** Default agent if <agent> placeholder exists */
	defaultAgent?: string;
	
	/** Whether this command is enabled */
	enabled: boolean;
	
	/** Optional platform restriction (if not set, works on all platforms) */
	platform?: PlatformType;
}

/**
 * Plugin settings interface
 */
export interface AITerminalSettings {
	/** Terminal type to use */
	terminalType: PlatformType;
	
	/** User-defined command templates */
	commands: CommandTemplate[];
}

/**
 * Execution context for command resolution
 */
export interface ExecutionContext {
	/** Current file (if available) */
	file?: TFile;
	
	/** Selected text in editor (if available) */
	selection?: string;
	
	/** Vault instance (always available) */
	vault: Vault;
	
	/** Override default prompt */
	prompt?: string;
	
	/** Override default agent */
	agent?: string;
}

/**
 * Placeholder type for documentation and validation
 */
export interface PlaceholderInfo {
	/** Placeholder name (without angle brackets) */
	name: string;
	
	/** Description of what it represents */
	description: string;
	
	/** Example value */
	example: string;
}

/**
 * Available placeholders for command templates
 */
export const AVAILABLE_PLACEHOLDERS: PlaceholderInfo[] = [
	{
		name: "file",
		description: "Filename only (without path)",
		example: "readme.md"
	},
	{
		name: "path",
		description: "Absolute file path",
		example: "/home/user/vault/notes/readme.md"
	},
	{
		name: "relative-path",
		description: "Path relative to vault root",
		example: "notes/readme.md"
	},
	{
		name: "dir",
		description: "Directory path of the file",
		example: "/home/user/vault/notes"
	},
	{
		name: "vault",
		description: "Vault root path",
		example: "/home/user/vault"
	},
	{
		name: "selection",
		description: "Selected text (if any)",
		example: "function example() { return 42; }"
	},
	{
		name: "prompt",
		description: "Prompt text (uses default if not specified)",
		example: "Fix issues in readme.md"
	},
	{
		name: "agent",
		description: "Agent name (uses default if not specified)",
		example: "noctis"
	}
];
