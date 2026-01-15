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

		// Prompt placeholder (with nested resolution) - resolve first
		if (resolved.includes("<prompt>")) {
			let promptValue = context.prompt || defaults.defaultPrompt || "";
			// Resolve nested placeholders in prompt
			promptValue = this.resolveAllPlaceholders(promptValue, context);
			resolved = resolved.replace(/<prompt>/g, this.escapeShell(promptValue));
		}

		// Agent placeholder
		const agentValue = context.agent || defaults.defaultAgent || "";
		resolved = resolved.replace(/<agent>/g, this.escapeShell(agentValue));

		// Resolve remaining placeholders in template
		resolved = this.resolveAllPlaceholders(resolved, context);

		return resolved;
	}

	/**
	 * Resolve all placeholders except <prompt> and <agent>
	 */
	private resolveAllPlaceholders(text: string, context: ExecutionContext): string {
		let resolved = text;

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
	 * Uses double quotes for PowerShell with backtick escaping
	 */
	private escapeShell(text: string): string {
		if (!text) return '""';
		
		// Use double quotes with backtick escaping for PowerShell
		// This handles newlines and special characters properly
		const escaped = text
			.replace(/`/g, '``')     // Escape backticks first
			.replace(/"/g, '`"')    // Escape double quotes
			.replace(/\$/g, '`$')   // Escape dollar signs
			.replace(/</g, '`<')     // Escape less-than (PowerShell redirection)
			.replace(/>/g, '`>')     // Escape greater-than (PowerShell redirection)
			.replace(/\r?\n/g, '`n'); // Convert newlines to PowerShell escape sequence
		
		return '"' + escaped + '"';
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
