import {describe, expect, it} from "vitest";
import {resolveShellType} from "./shell-selector";

describe("resolveShellType", () => {
	it("returns bash when terminalType is bash even on Windows", () => {
		expect(resolveShellType("bash", "win32")).toBe("bash");
	});

	it("returns powershell for system-default on Windows", () => {
		expect(resolveShellType("system-default", "win32")).toBe("powershell");
	});

	it("returns bash for system-default on non-Windows", () => {
		expect(resolveShellType("system-default", "linux")).toBe("bash");
	});
});