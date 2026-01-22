import {beforeEach, describe, expect, it} from "vitest";
import {JSDOM} from "jsdom";
import {App} from "obsidian";
import {CommandEditorModal} from "./command-editor";
import {AgentEditorModal} from "./agent-list-editor";
import {AgentConfig} from "../types";

const setupDom = () => {
	const dom = new JSDOM("<!doctype html><html><body></body></html>");
	(globalThis as any).window = dom.window;
	(globalThis as any).document = dom.window.document;
	(globalThis as any).HTMLElement = dom.window.HTMLElement;
	(globalThis as any).Event = dom.window.Event;
};

const getHeaderButtons = (modal: {contentEl: HTMLElement}): string[] => {
	const header = modal.contentEl.querySelector(".ai-terminal-modal-header");
	if (!header) {
		throw new Error("Header not found.");
	}
	return Array.from(header.querySelectorAll("button")).map(button => button.textContent?.trim() ?? "");
};

describe("editor modal headers", () => {
	beforeEach(() => {
		setupDom();
	});

	it("renders sticky header buttons in the command editor modal", () => {
		const agents: AgentConfig[] = [{id: "00000000-0000-4000-8000-000000000010", name: "noctis", enabled: true}];
		const modal = new CommandEditorModal(new App(), null, agents, async () => {});
		modal.open();

		const header = modal.contentEl.querySelector(".ai-terminal-modal-header");
		expect(header).toBeTruthy();
		expect(getHeaderButtons(modal)).toEqual(["Cancel", "Save"]);
		expect(modal.contentEl.querySelector(".modal-button-container")).toBeNull();
	});

	it("renders sticky header buttons in the agent editor modal", () => {
		const modal = new AgentEditorModal(new App(), null, [], async () => {});
		modal.open();

		const header = modal.contentEl.querySelector(".ai-terminal-modal-header");
		expect(header).toBeTruthy();
		expect(getHeaderButtons(modal)).toEqual(["Cancel", "Save"]);
		expect(modal.contentEl.querySelector(".modal-button-container")).toBeNull();
	});
});
