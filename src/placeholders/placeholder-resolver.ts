import {TFile} from "obsidian";
import {ExecutionContext} from "../types";
import {ContextCollector} from "./context-collector";

/**
 * Resolves placeholders in command templates
 */
export class PlaceholderResolver {
	constructor(private contextCollector: ContextCollector) {}

	/**
	 * Resolve placeholders for PowerShell execution using here-strings and variables
	 * This avoids argument splitting issues with quotes/newlines when invoking native commands.
	 */
	resolveForPowerShell(
		template: string,
		context: ExecutionContext,
		defaults: { defaultPrompt?: string; agentCommand?: string }
	): string {
		const rawValues = this.getRawPlaceholderValues(context);

		// Build prompt/agent raw values (prompt may contain nested placeholders)
		let promptValue = context.prompt || defaults.defaultPrompt || "";
		promptValue = this.replacePlaceholdersWithValues(promptValue, rawValues);
		const agentValue = context.agent || defaults.agentCommand || "";

		// Build command by substituting placeholders with PowerShell variables
		const command = this.replacePlaceholdersWithVariables(template);

		// Build PowerShell script with here-strings
		const scriptLines = [
			this.buildHereString("$aiPrompt", promptValue),
			this.buildHereString("$aiAgent", agentValue),
			this.buildHereString("$aiFile", rawValues.file),
			this.buildHereString("$aiPath", rawValues.path),
			this.buildHereString("$aiRelativePath", rawValues.relativePath),
			this.buildHereString("$aiDir", rawValues.dir),
			this.buildHereString("$aiVault", rawValues.vault),
			this.buildHereString("$aiSelection", rawValues.selection),
			command
		].filter(line => line.length > 0);

		return scriptLines.join("\n");
	}

	/**
	 * Resolve all placeholders in a template
	 */
	resolve(
		template: string,
		context: ExecutionContext,
		defaults: { defaultPrompt?: string; agentCommand?: string }
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
		const agentValue = context.agent || defaults.agentCommand || "";
		resolved = resolved.replace(/<agent>/g, this.escapeShell(agentValue));

		// Resolve remaining placeholders in template
		resolved = this.resolveAllPlaceholders(resolved, context);

		return resolved;
	}

	private buildHereString(variableName: string, value: string): string {
		if (value === "") {
			return `${variableName} = ''`;
		}
		return `${variableName} = @'\n${value}\n'@`;
	}

	private getRawPlaceholderValues(context: ExecutionContext): {
		file: string;
		path: string;
		relativePath: string;
		dir: string;
		vault: string;
		selection: string;
	} {
		let file = "";
		let path = "";
		let relativePath = "";
		let dir = "";
		if (context.file) {
			file = context.file.name;
			path = this.contextCollector.getFilePath(context.file);
			relativePath = this.contextCollector.getRelativePath(context.file);
			dir = this.contextCollector.getDirectoryPath(context.file);
		}

		return {
			file,
			path,
			relativePath,
			dir,
			vault: this.contextCollector.getVaultPath(),
			selection: context.selection || ""
		};
	}

	private replacePlaceholdersWithValues(
		text: string,
		values: {file: string; path: string; relativePath: string; dir: string; vault: string; selection: string;}
	): string {
		return text
			.replace(/<file>/g, values.file)
			.replace(/<path>/g, values.path)
			.replace(/<relative-path>/g, values.relativePath)
			.replace(/<dir>/g, values.dir)
			.replace(/<vault>/g, values.vault)
			.replace(/<selection>/g, values.selection);
	}

	private replacePlaceholdersWithVariables(text: string): string {
		return text
			.replace(/<prompt>/g, "$aiPrompt")
			.replace(/<agent>/g, "$aiAgent")
			.replace(/<file>/g, "$aiFile")
			.replace(/<path>/g, "$aiPath")
			.replace(/<relative-path>/g, "$aiRelativePath")
			.replace(/<dir>/g, "$aiDir")
			.replace(/<vault>/g, "$aiVault")
			.replace(/<selection>/g, "$aiSelection");
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
	 * For PowerShell with Base64 encoding:
	 * - Base64 bypasses command-line parsing (3-layer parsing)
	 * - BUT PowerShell script parser still runs on decoded content
	 * - Use PowerShell standard backtick escaping
	 */
	private escapeShell(text: string): string {
		if (!text) return '""';
		
		// PowerShell uses backtick (`) as escape character, not backslash (\)
		const escaped = text
			.replace(/`/g, '``')      // Escape backtick itself first
			.replace(/"/g, '`"')     // Escape double quotes
			.replace(/\$/g, '`$')     // Escape dollar signs (variable expansion)
			.replace(/\r?\n/g, '`n'); // Escape newlines
		
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
	 * Always returns vault root for consistent access to all vault files
	 */
	getWorkingDirectory(context: ExecutionContext): string {
		return this.contextCollector.getVaultPath();
	}
}
