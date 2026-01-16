import {describe, it, expect} from "vitest";
import {buildContextDisplay, buildDirectPromptCommand, MAX_SELECTION_PREVIEW} from "./direct-prompt-utils";

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
		const result = buildDirectPromptCommand("<agent> -i <prompt>", "copilot", "<file> <selection> explain this");
		expect(result.template).toBe("copilot -i <prompt>");
		expect(result.promptValue).toBe("<file> <selection> explain this");
	});

	it("builds direct prompt command with context only", () => {
		const result = buildDirectPromptCommand("<agent> <prompt>", "opencode", "<file>");
		expect(result.template).toBe("opencode <prompt>");
		expect(result.promptValue).toBe("<file>");
	});

	it("builds direct prompt command with no prompt or context", () => {
		const result = buildDirectPromptCommand("<agent>", "opencode", "");
		expect(result.template).toBe("opencode");
		expect(result.promptValue).toBe("");
	});
});
