import {Notice} from "obsidian";
import AITerminalPlugin from "../main";
import {CommandTemplate, ExecutionContext} from "../types";
import {ContextCollector} from "../placeholders/context-collector";
import {PlaceholderResolver} from "../placeholders/placeholder-resolver";
import {TerminalLauncher} from "../terminal/terminal-launcher";
import {resolveShellType} from "../terminal/shell-selector";

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
	): Promise<boolean> {
		try {
			const agent = this.plugin.settings.agents.find(current => current.id === command.agentId);
			if (!agent) {
				new Notice(`Agent with ID '${command.agentId}' not found. Please update template.`);
				return false;
			}

			// Build full execution context
			const fullContext: ExecutionContext = {
				...context,
				agent: context.agent ?? agent.name,
				vault: this.plugin.app.vault
			};

			// Check if file context is required
			if (this.placeholderResolver.requiresFileContext(command.template) && !fullContext.file) {
				new Notice("This command requires an active file. Please open a file and try again.");
				return false;
			}

			const shell = resolveShellType(this.plugin.settings.terminalType);
			const resolvedCommand = this.placeholderResolver.resolveForShell(
				command.template,
				fullContext,
				{
					defaultPrompt: command.defaultPrompt,
					agentCommand: agent.name
				},
				shell
			);

			// Get working directory
			const workingDir = this.placeholderResolver.getWorkingDirectory(fullContext);

			// Launch terminal
			await this.terminalLauncher.launch(
				this.plugin.settings.terminalType,
				resolvedCommand,
				workingDir
			);

			new Notice(`Launched: ${command.name}`);
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Failed to execute command: ${message}`);
			console.error("Command execution error:", error);
			return false;
		}
	}
}
