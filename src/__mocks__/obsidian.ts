// Mock Obsidian API for testing
type CssProps = Record<string, string>;

function addElementHelpers<T extends HTMLElement>(element: T): T {
	const anyEl = element as any;
	if (!anyEl.createEl) {
		anyEl.createEl = (tag: string, options?: {text?: string; cls?: string}) => {
			const child = document.createElement(tag);
			if (options?.text) {
				child.textContent = options.text;
			}
			if (options?.cls) {
				child.className = options.cls;
			}
			addElementHelpers(child);
			element.appendChild(child);
			return child;
		};
	}
	if (!anyEl.createDiv) {
		anyEl.createDiv = (options?: {cls?: string}) => anyEl.createEl("div", options);
	}
	if (!anyEl.empty) {
		anyEl.empty = () => {
			element.innerHTML = "";
		};
	}
	if (!anyEl.addClass) {
		anyEl.addClass = (cls: string) => {
			element.classList.add(cls);
		};
	}
	if (!anyEl.setCssProps) {
		anyEl.setCssProps = (props: CssProps) => {
			Object.assign((element as any).style, props);
		};
	}
	if (!anyEl.appendText) {
		anyEl.appendText = (text: string) => {
			element.appendChild(document.createTextNode(text));
		};
	}
	return element;
}

class TextComponent {
	inputEl: HTMLInputElement;
	private onChangeCallback?: (value: string) => void;

	constructor(inputEl: HTMLInputElement) {
		this.inputEl = inputEl;
	}

	setPlaceholder(value: string): this {
		this.inputEl.placeholder = value;
		return this;
	}

	setValue(value: string): this {
		this.inputEl.value = value;
		return this;
	}

	onChange(callback: (value: string) => void): this {
		this.onChangeCallback = callback;
		this.inputEl.addEventListener("input", () => callback(this.inputEl.value));
		return this;
	}
}

class TextAreaComponent {
	inputEl: HTMLTextAreaElement;
	private onChangeCallback?: (value: string) => void;

	constructor(inputEl: HTMLTextAreaElement) {
		this.inputEl = inputEl;
	}

	setPlaceholder(value: string): this {
		this.inputEl.placeholder = value;
		return this;
	}

	setValue(value: string): this {
		this.inputEl.value = value;
		return this;
	}

	onChange(callback: (value: string) => void): this {
		this.onChangeCallback = callback;
		this.inputEl.addEventListener("input", () => callback(this.inputEl.value));
		return this;
	}
}

class DropdownComponent {
	selectEl: HTMLSelectElement;
	private onChangeCallback?: (value: string) => void;

	constructor(selectEl: HTMLSelectElement) {
		this.selectEl = selectEl;
	}

	addOption(value: string, display: string): this {
		const option = document.createElement("option");
		option.value = value;
		option.textContent = display;
		this.selectEl.appendChild(option);
		return this;
	}

	setValue(value: string): this {
		this.selectEl.value = value;
		return this;
	}

	setDisabled(disabled: boolean): this {
		this.selectEl.disabled = disabled;
		return this;
	}

	onChange(callback: (value: string) => void): this {
		this.onChangeCallback = callback;
		this.selectEl.addEventListener("change", () => callback(this.selectEl.value));
		return this;
	}
}

class ToggleComponent {
	inputEl: HTMLInputElement;
	private onChangeCallback?: (value: boolean) => void;

	constructor(inputEl: HTMLInputElement) {
		this.inputEl = inputEl;
	}

	setValue(value: boolean): this {
		this.inputEl.checked = value;
		return this;
	}

	onChange(callback: (value: boolean) => void): this {
		this.onChangeCallback = callback;
		this.inputEl.addEventListener("change", () => callback(this.inputEl.checked));
		return this;
	}
}

export class TFile {
	name: string;
	path: string;

	constructor() {
		this.name = "";
		this.path = "";
	}
}

export class Vault {
	getName(): string {
		return "TestVault";
	}
}

export class Notice {
	constructor(message: string) {
		console.log(`Notice: ${message}`);
	}
}

export class App {
	workspace: any;
	vault: Vault;

	constructor() {
		this.vault = new Vault();
		this.workspace = { on: () => ({}) };
	}
}

export class WorkspaceLeaf {
	view: any;
	async setViewState(state: any): Promise<void> {
		this.view = state;
	}
}

export class ItemView {
	app: App;
	leaf: WorkspaceLeaf;
	contentEl: HTMLElement & {createEl?: any; createDiv?: any; empty?: any; addClass?: any};

	constructor(leaf: WorkspaceLeaf) {
		this.leaf = leaf;
		this.app = new App();
		this.contentEl = addElementHelpers(document.createElement("div"));
	}

	getViewType(): string {
		return "";
	}

	getDisplayText(): string {
		return "";
	}

	onOpen(): void {}
	onClose(): void {}
}

export class MenuItem {
	private onClickCallback?: () => void;
	private title?: string;
	private icon?: string;

	setTitle(title: string): this {
		this.title = title;
		return this;
	}

	setIcon(icon: string): this {
		this.icon = icon;
		return this;
	}

	onClick(callback: () => void): this {
		this.onClickCallback = callback;
		return this;
	}

	trigger(): void {
		this.onClickCallback?.();
	}
}

export class Menu {
	items: MenuItem[] = [];
	separators = 0;
	closed = false;

	addSeparator(): void {
		this.separators += 1;
	}

	addItem(callback: (item: MenuItem) => void): void {
		const item = new MenuItem();
		callback(item);
		this.items.push(item);
	}

	hide(): void {
		this.closed = true;
	}
}

export class Editor {
	getSelection(): string {
		return "";
	}
}

export class MarkdownView {
	file: TFile | null = null;
}

export class Plugin {
	app: any;
	manifest: any;
	loadData(): Promise<any> {
		return Promise.resolve({});
	}
	saveData(data: any): Promise<void> {
		return Promise.resolve();
	}
}

export class PluginSettingTab {}

export class Setting {
	settingEl: HTMLElement & {addClass?: (cls: string) => void};
	nameEl?: HTMLElement;
	descEl?: HTMLElement;

	constructor(containerEl?: HTMLElement) {
		this.settingEl = addElementHelpers(document.createElement("div"));
		if (containerEl) {
			containerEl.appendChild(this.settingEl);
		}
	}

	setName(name: string): this {
		this.nameEl = this.settingEl.createEl("div", {text: name});
		return this;
	}

	setDesc(desc: string): this {
		if (!this.descEl) {
			this.descEl = this.settingEl.createEl("div", {text: desc});
		} else {
			this.descEl.textContent = desc;
		}
		return this;
	}

	addText(callback: (text: TextComponent) => void): this {
		const inputEl = addElementHelpers(document.createElement("input"));
		this.settingEl.appendChild(inputEl);
		callback(new TextComponent(inputEl));
		return this;
	}

	addTextArea(callback: (text: TextAreaComponent) => void): this {
		const inputEl = addElementHelpers(document.createElement("textarea"));
		this.settingEl.appendChild(inputEl);
		callback(new TextAreaComponent(inputEl));
		return this;
	}

	addDropdown(callback: (dropdown: DropdownComponent) => void): this {
		const selectEl = addElementHelpers(document.createElement("select"));
		this.settingEl.appendChild(selectEl);
		callback(new DropdownComponent(selectEl));
		return this;
	}

	addToggle(callback: (toggle: ToggleComponent) => void): this {
		const inputEl = addElementHelpers(document.createElement("input"));
		inputEl.type = "checkbox";
		this.settingEl.appendChild(inputEl);
		callback(new ToggleComponent(inputEl));
		return this;
	}
}

export class Modal {
	app: App;
	contentEl: HTMLElement & {createEl?: any; createDiv?: any; empty?: any; addClass?: any};
	opened = false;

	constructor(app: App) {
		this.app = app;
		this.contentEl = addElementHelpers(document.createElement("div"));
	}

	open(): void {
		this.opened = true;
		this.onOpen?.();
	}

	close(): void {
		this.opened = false;
		this.onClose?.();
	}

	onOpen(): void {}
	onClose(): void {}
}

export const Platform = {
	isWin: false,
	isMacOS: false,
	isLinux: true
};
