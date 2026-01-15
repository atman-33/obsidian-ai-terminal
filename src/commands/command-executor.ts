import {Notice} from "obsidian";
import AITerminalPlugin from "../main";
import {CommandTemplate, ExecutionContext} from "../types";
import {ContextCollector} from "../placeholders/context-collector";
import {PlaceholderResolver} from "../placeholders/placeholder-resolver";
import {TerminalLauncher} from "../terminal/terminal-launcher";

/**
 * Orchestrates command execution
 */
export class CommandExecutor {
	private contextCollector: ContextCollector;
	private placeholderResolver: PlaceholderResolver;
	private terminalLauncher: TerminalLauncher;

	constructor(private plugin: AITerminalPlugin) {
		this.contextCollector = new ContextCollector(plugin.app);
		this.placeholderResolver = new PlaceholderResolver(this.contextCollector);
		this.terminalLauncher = new TerminalLauncher();
	}

	/**
	 * Execute a command template with given context
	 */
	async executeCommand(
		command: CommandTemplate,
		context: Partial<ExecutionContext>
	): Promise<void> {
		try {
			// Build full execution context
			const fullContext: ExecutionContext = {
				...context,
				vault: this.plugin.app.vault
			};

			// Check if file context is required
			if (this.placeholderResolver.requiresFileContext(command.template) && !fullContext.file) {
				new Notice("This command requires an active file. Please open a file and try again.");
				return;
			}

			// Debug: log context before resolution
			console.log('[AI Terminal] Context before resolution:', {
				file: fullContext.file?.name,
				selection: fullContext.selection,
				prompt: fullContext.prompt,
				agent: fullContext.agent
			});

			// Resolve placeholders
			const resolvedCommand = this.placeholderResolver.resolve(
				command.template,
				fullContext,
				{
					defaultPrompt: command.defaultPrompt,
					defaultAgent: command.defaultAgent
				}
			);

			console.log('[AI Terminal] Resolved command:', resolvedCommand);

			// Get working directory
			const workingDir = this.placeholderResolver.getWorkingDirectory(fullContext);

			// Launch terminal
			await this.terminalLauncher.launch(
				this.plugin.settings.terminalType,
				resolvedCommand,
				workingDir,
				this.plugin.settings.wslDistribution
			);

			new Notice(`Launched: ${command.name}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Failed to execute command: ${message}`);
			console.error("Command execution error:", error);
		}
	}
}
