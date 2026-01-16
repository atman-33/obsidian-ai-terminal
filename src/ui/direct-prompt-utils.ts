export const MAX_SELECTION_PREVIEW = 200;

export function truncateSelection(selection: string | undefined): string {
	if (!selection || selection.length <= MAX_SELECTION_PREVIEW) {
		return selection ?? "";
	}
	return `${selection.slice(0, MAX_SELECTION_PREVIEW)}...`;
}

export function buildContextDisplay(
	filePath?: string,
	selection?: string
): { displayText: string; promptText: string } {
	const contextParts: string[] = [];
	if (filePath) {
		contextParts.push(`<file:${filePath}>`);
	}

	if (selection !== undefined && selection !== null && selection.length > 0) {
		const truncated = truncateSelection(selection);
		contextParts.push(`<selection:${truncated}>`);
	}

	const displayText = contextParts.join("\n");
	const promptText = contextParts.join(" ").trim();

	return {
		displayText,
		promptText
	};
}

export function buildDirectPromptCommand(
	commandTemplate: string,
	agentName: string,
	userPrompt: string
): { template: string; promptValue: string } {
	// Use the provided command template, replacing <agent> placeholder if present
	const template = commandTemplate.replace(/<agent>/g, agentName);
	
	// User prompt is used as-is (may contain placeholders like <file>, <selection>)
	const promptValue = userPrompt.trim();

	return {
		template,
		promptValue
	};
}
