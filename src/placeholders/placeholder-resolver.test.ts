import {describe, it, expect, beforeEach, vi} from "vitest";
import {PlaceholderResolver} from "./placeholder-resolver";
import {ContextCollector} from "./context-collector";
import {TFile, Vault} from "obsidian";
import {ExecutionContext} from "../types";

describe("PlaceholderResolver", () => {
	let resolver: PlaceholderResolver;
	let mockContextCollector: ContextCollector;
	let mockFile: TFile;
	let mockVault: Vault;

	beforeEach(() => {
		mockVault = new Vault();
		mockFile = new TFile();
		mockFile.name = "Welcome.md";
		mockFile.path = "Welcome.md";
		
		mockContextCollector = {
			getVaultPath: vi.fn(() => "C:\\obsidian\\test"),
			getFilePath: vi.fn(() => "C:\\obsidian\\test\\Welcome.md"),
			getRelativePath: vi.fn(() => "Welcome.md"),
			getDirectoryPath: vi.fn(() => "C:\\obsidian\\test")
		} as any;

		resolver = new PlaceholderResolver(mockContextCollector);
	});

	describe("escapeShell", () => {
		it("should wrap empty string in double quotes", () => {
			const context: ExecutionContext = {vault: mockVault};
			const result = resolver.resolve("<vault>", context, {});
			expect(mockContextCollector.getVaultPath).toHaveBeenCalled();
		});

		it("should escape double quotes with PowerShell backtick", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				selection: 'Say "Hello"'
			};
			const result = resolver.resolve("<selection>", context, {});
			expect(result).toContain('`"');
		});

		it("should not escape backslashes (literal in PowerShell)", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				selection: "C:\\path\\to\\file"
			};
			const result = resolver.resolve("<selection>", context, {});
			// PowerShell treats backslashes as literal in strings
			expect(result).toBe('"C:\\path\\to\\file"');
		});

		it("should escape PowerShell special characters with backtick", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				selection: "test $var `cmd`"
			};
			const result = resolver.resolve("<selection>", context, {});
			// PowerShell requires backtick escaping for special chars
			expect(result).toContain('`$');  // Dollar sign escaped
			expect(result).toContain('``');  // Backtick escaped
		});

		it("should escape newlines", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				selection: "line1\nline2\r\nline3"
			};
			const result = resolver.resolve("<selection>", context, {});
			expect(result).toContain('`n');
		});
	});

	describe("resolve - basic placeholders", () => {
		it("should resolve <file> placeholder", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				file: mockFile
			};
			const result = resolver.resolve("Edit <file>", context, {});
			expect(result).toContain("Welcome.md");
		});

		it("should resolve <path> placeholder", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				file: mockFile
			};
			const result = resolver.resolve("<path>", context, {});
			expect(result).toContain("C:\\obsidian\\test\\Welcome.md");
		});

		it("should resolve <relative-path> placeholder", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				file: mockFile
			};
			const result = resolver.resolve("<relative-path>", context, {});
			expect(result).toContain("Welcome.md");
		});

		it("should resolve <dir> placeholder", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				file: mockFile
			};
			const result = resolver.resolve("<dir>", context, {});
			expect(result).toContain("C:\\obsidian\\test");
		});

		it("should resolve <vault> placeholder", () => {
			const context: ExecutionContext = {vault: mockVault};
			const result = resolver.resolve("<vault>", context, {});
			expect(result).toContain("C:\\obsidian\\test");
		});

		it("should resolve <selection> placeholder", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				selection: "Selected text"
			};
			const result = resolver.resolve("<selection>", context, {});
			expect(result).toContain("Selected text");
		});
	});

	describe("resolve - prompt and agent", () => {
		it("should resolve <prompt> with default", () => {
			const context: ExecutionContext = {vault: mockVault};
			const result = resolver.resolve("<prompt>", context, {
				defaultPrompt: "Default prompt"
			});
			expect(result).toContain("Default prompt");
		});

		it("should resolve <agent> with default", () => {
			const context: ExecutionContext = {vault: mockVault};
			const result = resolver.resolve("<agent>", context, {
				defaultAgent: "noctis"
			});
			expect(result).toContain("noctis");
		});

		it("should resolve nested placeholders in prompt", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				file: mockFile,
				selection: "test"
			};
			const result = resolver.resolve("<prompt>", context, {
				defaultPrompt: "Review <file> in <vault> with <selection>"
			});
			expect(result).toContain("Welcome.md");
			expect(result).toContain("C:\\obsidian\\test");
			expect(result).toContain("test");
		});
	});

	describe("resolve - edge cases", () => {
		it("should handle empty selection", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				selection: ""
			};
			const result = resolver.resolve("Test <selection>", context, {});
			expect(result).toContain('""'); // Empty escaped string
		});

		it("should handle missing file context", () => {
			const context: ExecutionContext = {vault: mockVault};
			const result = resolver.resolve("<file> <path>", context, {});
			expect(result).not.toContain("<file>");
			expect(result).not.toContain("<path>");
		});

		it("should handle complex command with quotes", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				file: mockFile
			};
			const template = 'copilot --agent <agent> -i <prompt>';
			const result = resolver.resolve(template, context, {
				defaultAgent: "obsidian-note-organizer",
				defaultPrompt: 'Review <file>'
			});
			expect(result).toContain("obsidian-note-organizer");
			expect(result).toContain("Welcome.md");
			expect(result).toContain('`"'); // Backtick-escaped quotes
		});

		it("should handle apostrophes in selection", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				selection: "When you're ready, delete this note and make the vault your own."
			};
			const result = resolver.resolve("<selection>", context, {});
			expect(result).toContain("you're");
			// Single quotes don't need escaping in PowerShell double-quoted strings
		});

		it("should handle multiple placeholders in one template", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				file: mockFile,
				selection: "test"
			};
			const template = "File: <file>, Path: <path>, Vault: <vault>, Selection: <selection>";
			const result = resolver.resolve(template, context, {});
			expect(result).toContain("Welcome.md");
			expect(result).toContain("C:\\obsidian\\test");
			expect(result).toContain("test");
		});
	});

	describe("resolve - real world scenarios", () => {
		it("should handle copilot command with nested placeholders", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				file: mockFile,
				selection: "When you're ready, delete this note."
			};
			const template = 'copilot --agent <agent> -i <prompt>';
			const defaults = {
				defaultAgent: "obsidian-note-organizer",
				defaultPrompt: "Review <file>\n- <vault>\n- <selection>"  // Actual newlines
			};
			const result = resolver.resolve(template, context, defaults);
			
			// Should contain agent
			expect(result).toContain("obsidian-note-organizer");
			// Should contain resolved placeholders from prompt
			expect(result).toContain("Welcome.md");
			expect(result).toContain("C:\\obsidian\\test");
			expect(result).toContain("you're");
		});
	});

	describe("resolveForPowerShell", () => {
		it("should build PowerShell script with variables and here-strings", () => {
			const context: ExecutionContext = {
				vault: mockVault,
				file: mockFile,
				selection: "When you're ready, delete this note."
			};
			const template = 'copilot --agent <agent> -i <prompt>';
			const defaults = {
				defaultAgent: "obsidian-note-organizer",
				defaultPrompt: "Review <file>\n- <vault>\n- <selection>"
			};
			const result = resolver.resolveForPowerShell(template, context, defaults);
			
			expect(result).toContain("$aiPrompt = @'");
			expect(result).toContain("$aiAgent = @'");
			expect(result).toContain("$aiVault = @'");
			expect(result).toContain("copilot --agent $aiAgent -i $aiPrompt");
			expect(result).toContain("Welcome.md");
			expect(result).toContain("C:\\obsidian\\test");
			expect(result).toContain("you're");
		});
	});
});
