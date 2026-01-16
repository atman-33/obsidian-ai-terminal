import {CommandTemplate, AVAILABLE_PLACEHOLDERS} from "../types";
import AITerminalPlugin from "../main";

/**
 * Manages command templates (CRUD operations)
 */
export class CommandManager {
	constructor(private plugin: AITerminalPlugin) {}

	/**
	 * Get all enabled command templates
	 */
	getEnabledCommands(): CommandTemplate[] {
		return this.plugin.settings.commands.filter(cmd => cmd.enabled);
	}

	/**
	 * Get all command templates (including disabled)
	 */
	getAllCommands(): CommandTemplate[] {
		return this.plugin.settings.commands;
	}

	/**
	 * Add a new command template
	 */
	async addCommand(command: CommandTemplate): Promise<void> {
		// Validate unique ID
		if (this.plugin.settings.commands.some(cmd => cmd.id === command.id)) {
			throw new Error(`Command with ID '${command.id}' already exists`);
		}

		// Validate template
		this.validateTemplate(command.template);

		this.plugin.settings.commands.push(command);
		await this.plugin.saveSettings();
	}

	/**
	 * Update an existing command template
	 */
	async updateCommand(id: string, updates: Partial<CommandTemplate>): Promise<void> {
		const index = this.plugin.settings.commands.findIndex(cmd => cmd.id === id);
		if (index === -1) {
			throw new Error(`Command with ID '${id}' not found`);
		}

		const current = this.plugin.settings.commands[index];
		if (!current) {
			throw new Error(`Command at index ${index} is undefined`);
		}
		
		const updated: CommandTemplate = {
			id: current.id,
			name: updates.name ?? current.name,
			template: updates.template ?? current.template,
			enabled: updates.enabled ?? current.enabled,
			defaultPrompt: updates.defaultPrompt ?? current.defaultPrompt,
			defaultAgent: updates.defaultAgent ?? current.defaultAgent,
			platform: updates.platform ?? current.platform
		};
		
		// Validate template if changed
		if (updates.template) {
			this.validateTemplate(updates.template);
		}

		this.plugin.settings.commands[index] = updated;
		await this.plugin.saveSettings();
	}

	/**
	 * Remove a command template
	 */
	async removeCommand(id: string): Promise<void> {
		const index = this.plugin.settings.commands.findIndex(cmd => cmd.id === id);
		if (index === -1) {
			throw new Error(`Command with ID '${id}' not found`);
		}

		this.plugin.settings.commands.splice(index, 1);
		await this.plugin.saveSettings();
	}

	/**
	 * Move command up in the list
	 */
	async moveCommandUp(id: string): Promise<void> {
		const commands = this.plugin.settings.commands;
		const index = commands.findIndex(cmd => cmd.id === id);
		if (index <= 0) return; // Already at top or not found

		const current = commands[index];
		const previous = commands[index - 1];
		if (!current || !previous) return;
		
		commands[index] = previous;
		commands[index - 1] = current;
		
		await this.plugin.saveSettings();
	}

	/**
	 * Move command down in the list
	 */
	async moveCommandDown(id: string): Promise<void> {
		const commands = this.plugin.settings.commands;
		const index = commands.findIndex(cmd => cmd.id === id);
		if (index === -1 || index >= commands.length - 1) return;

		const current = commands[index];
		const next = commands[index + 1];
		if (!current || !next) return;
		
		commands[index] = next;
		commands[index + 1] = current;
		
		await this.plugin.saveSettings();
	}

	/**
	 * Toggle command enabled state
	 */
	async toggleCommand(id: string): Promise<void> {
		const command = this.plugin.settings.commands.find(cmd => cmd.id === id);
		if (!command) {
			throw new Error(`Command with ID '${id}' not found`);
		}

		command.enabled = !command.enabled;
		await this.plugin.saveSettings();
	}

	/**
	 * Validate command template syntax
	 */
	validateTemplate(template: string): void {
		// Extract placeholders from template
		const placeholderRegex = /<([^>]+)>/g;
		const matches = Array.from(template.matchAll(placeholderRegex));
		
		const validPlaceholders = new Set(AVAILABLE_PLACEHOLDERS.map(p => p.name));
		const invalidPlaceholders: string[] = [];

		for (const match of matches) {
			const placeholder = match[1];
			if (placeholder && !validPlaceholders.has(placeholder)) {
				invalidPlaceholders.push(placeholder);
			}
		}

		if (invalidPlaceholders.length > 0) {
			throw new Error(
				`Invalid placeholders found: ${invalidPlaceholders.map(p => `<${p}>`).join(", ")}. ` +
				`Valid placeholders: ${Array.from(validPlaceholders).map(p => `<${p}>`).join(", ")}`
			);
		}

		// Warn about potentially dangerous commands
		const dangerousPatterns = [
			/rm\s+-rf/i,
			/dd\s+if=/i,
			/mkfs/i,
			/:\(\)\{\s*:\|:&\s*\};:/i, // Fork bomb
		];

		for (const pattern of dangerousPatterns) {
			if (pattern.test(template)) {
				// This is a warning, not an error - we'll let it through but log it
				console.warn(`Warning: Command template contains potentially dangerous command: ${template}`);
				break;
			}
		}
	}
}
