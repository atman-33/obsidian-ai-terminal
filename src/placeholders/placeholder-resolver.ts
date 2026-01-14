import {TFile} from "obsidian";
import {ExecutionContext, CommandTemplate} from "../types";
import {ContextCollector} from "./context-collector";

/**
 * Resolves placeholders in command templates
 */
export class PlaceholderResolver {
	constructor(private contextCollector: ContextCollector) {}

	/**
	 * Resolve all placeholders in a template
	 */
	resolve(
		template: string,
		context: ExecutionContext,
		defaults: Pick<CommandTemplate, "defaultPrompt" | "defaultAgent">
	): string {
		let resolved = template;

		// File-related placeholders
		if (context.file) {
			resolved = this.replaceFilePlaceholders(resolved, context.file);
		} else {
			// Replace with empty strings if no file context
			resolved = resolved.replace(/<file>/g, "");
			resolved = resolved.replace(/<path>/g, "");
			resolved = resolved.replace(/<relative-path>/g, "");
			resolved = resolved.replace(/<dir>/g, "");
		}

		// Vault placeholder
		const vaultPath = this.contextCollector.getVaultPath();
		resolved = resolved.replace(/<vault>/g, this.escapeShell(vaultPath));

		// Selection placeholder
		const selection = context.selection || "";
		resolved = resolved.replace(/<selection>/g, this.escapeShell(selection));

		// Prompt placeholder (with nested resolution)
		if (resolved.includes("<prompt>")) {
			let promptValue = context.prompt || defaults.defaultPrompt || "";
			// Resolve nested placeholders in prompt
			if (context.file) {
				promptValue = this.replaceFilePlaceholders(promptValue, context.file);
			}
			resolved = resolved.replace(/<prompt>/g, this.escapeShell(promptValue));
		}

		// Agent placeholder
		const agentValue = context.agent || defaults.defaultAgent || "";
		resolved = resolved.replace(/<agent>/g, this.escapeShell(agentValue));

		return resolved;
	}

	/**
	 * Replace file-related placeholders
	 */
	private replaceFilePlaceholders(text: string, file: TFile): string {
		let result = text;

		// <file> - filename only
		result = result.replace(/<file>/g, this.escapeShell(file.name));

		// <path> - absolute path
		const fullPath = this.contextCollector.getFilePath(file);
		result = result.replace(/<path>/g, this.escapeShell(fullPath));

		// <relative-path> - vault relative path
		const relativePath = this.contextCollector.getRelativePath(file);
		result = result.replace(/<relative-path>/g, this.escapeShell(relativePath));

		// <dir> - directory path
		const dirPath = this.contextCollector.getDirectoryPath(file);
		result = result.replace(/<dir>/g, this.escapeShell(dirPath));

		return result;
	}

	/**
	 * Escape shell special characters to prevent command injection
	 */
	private escapeShell(text: string): string {
		if (!text) return "";

		// For safety, we'll use double quotes and escape special characters
		// This works on both Windows and Unix-like systems
		return '"' + text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`") + '"';
	}

	/**
	 * Check if template requires file context
	 */
	requiresFileContext(template: string): boolean {
		return /<file>|<path>|<relative-path>|<dir>/.test(template);
	}

	/**
	 * Get working directory for terminal launch
	 */
	getWorkingDirectory(context: ExecutionContext): string {
		if (context.file) {
			return this.contextCollector.getDirectoryPath(context.file);
		}
		return this.contextCollector.getVaultPath();
	}
}
