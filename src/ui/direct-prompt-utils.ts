export const MAX_SELECTION_PREVIEW = 200;

export function truncateSelection(selection: string): string {
	if (selection.length <= MAX_SELECTION_PREVIEW) {
		return selection;
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

	if (selection !== undefined) {
		contextParts.push(`<selection:${truncateSelection(selection)}>`);
	}

	return {
		displayText: contextParts.join("\n"),
		promptText: contextParts.join(" ").trim()
	};
}

export function buildDirectPromptCommand(
	agentName: string,
	contextPrompt: string,
	userPrompt: string
): { template: string; promptValue: string } {
	const trimmedPrompt = userPrompt.trim();
	const hasUserPrompt = trimmedPrompt.length > 0;
	const hasContext = contextPrompt.length > 0;

	if (hasUserPrompt) {
		return {
			template: `${agentName} -i <prompt>`,
			promptValue: [contextPrompt, trimmedPrompt].filter(Boolean).join(" ")
		};
	}

	if (hasContext) {
		return {
			template: `${agentName} <prompt>`,
			promptValue: contextPrompt
		};
	}

	return {
		template: agentName,
		promptValue: ""
	};
}
