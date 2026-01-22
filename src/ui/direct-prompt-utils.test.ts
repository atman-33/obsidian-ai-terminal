import {describe, it, expect} from "vitest";
import {buildContextDisplay, createDirectPromptCommand, MAX_SELECTION_PREVIEW} from "./direct-prompt-utils";

describe("direct prompt utils", () => {
	it("builds context display with file and selection", () => {
		const result = buildContextDisplay("/vault/note.md", "selected text");
		expect(result.displayText).toBe("<file:/vault/note.md>\n<selection:selected text>");
		expect(result.promptText).toBe("<file:/vault/note.md> <selection:selected text>");
	});

	it("truncates selection over max length", () => {
		const longSelection = "a".repeat(MAX_SELECTION_PREVIEW + 5);
		const result = buildContextDisplay("/vault/note.md", longSelection);
		expect(result.displayText).toContain("...");
		// Display includes file path + newline + "<selection:" + truncated text + ">"
		// Should be less than original selection + reasonable overhead
		expect(result.displayText.length).toBeLessThan(longSelection.length + 50);
	});

	it("builds direct prompt command with user prompt", () => {
		const result = createDirectPromptCommand(
			"<agent> -i <prompt>",
			"00000000-0000-4000-8000-000000000010",
			"copilot",
			"<file> <selection> explain this"
		);
		expect(result.command.template).toBe("copilot -i <prompt>");
		expect(result.command.agentId).toBe("00000000-0000-4000-8000-000000000010");
		expect(result.promptValue).toBe("<file> <selection> explain this");
	});

	it("builds direct prompt command with context only", () => {
		const result = createDirectPromptCommand(
			"<agent> <prompt>",
			"00000000-0000-4000-8000-000000000011",
			"opencode",
			"<file>"
		);
		expect(result.command.template).toBe("opencode <prompt>");
		expect(result.command.agentId).toBe("00000000-0000-4000-8000-000000000011");
		expect(result.promptValue).toBe("<file>");
	});

	it("builds direct prompt command with no prompt or context", () => {
		const result = createDirectPromptCommand(
			"<agent>",
			"00000000-0000-4000-8000-000000000012",
			"opencode",
			""
		);
		expect(result.command.template).toBe("opencode");
		expect(result.command.agentId).toBe("00000000-0000-4000-8000-000000000012");
		expect(result.promptValue).toBe("");
	});
});
