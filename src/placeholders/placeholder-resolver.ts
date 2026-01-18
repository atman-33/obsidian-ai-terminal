import {TFile} from "obsidian";
import {ExecutionContext} from "../types";
import {ContextCollector} from "./context-collector";

/**
 * Resolves placeholders in command templates
 */
export class PlaceholderResolver {
	constructor(private contextCollector: ContextCollector) {}

	/**
	 * Resolve placeholders for a specific shell with inline escaping.
	 *
	 * @param template Command template containing placeholders.
	 * @param context Execution context data.
	 * @param defaults Default prompt/agent fallback values.
	 * @param shell Target shell for escaping rules.
	 * @returns Resolved command string.
	 */
	resolveForShell(
		template: string,
		context: ExecutionContext,
		defaults: { defaultPrompt?: string; agentCommand?: string },
		shell: "powershell" | "bash"
	): string {
		const rawValues = this.getRawPlaceholderValues(context);
		const escape = shell === "powershell"
			? this.escapeForPowerShell.bind(this)
			: this.escapeForBash.bind(this);

		let promptValue = context.prompt || defaults.defaultPrompt || "";
		promptValue = this.replacePlaceholdersWithValues(promptValue, rawValues);
		const agentValue = context.agent || defaults.agentCommand || "";

		let resolved = template;
		const replacements = [
			{token: "<prompt>", value: promptValue},
			{token: "<agent>", value: agentValue},
			{token: "<file>", value: rawValues.file},
			{token: "<path>", value: rawValues.path},
			{token: "<relative-path>", value: rawValues.relativePath},
			{token: "<dir>", value: rawValues.dir},
			{token: "<vault>", value: rawValues.vault},
			{token: "<selection>", value: rawValues.selection}
		];

		replacements.forEach(({token, value}) => {
			const escaped = escape(value);
			resolved = resolved.split(`"${token}"`).join(escaped);
			resolved = resolved.split(`'${token}'`).join(escaped);
			resolved = resolved.split(token).join(escaped);
		});

		return resolved;
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

	private escapeForPowerShell(value: string): string {
		const escaped = value
			.replace(/"/g, '\\"')
			.replace(/'/g, "''")
			;
		return `'${escaped}'`;
	}

	private escapeForBash(value: string): string {
		const escaped = value.replace(/'/g, "'\\''");
		return `'${escaped}'`;
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
