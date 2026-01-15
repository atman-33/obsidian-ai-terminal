// Mock Obsidian API for testing
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
export class Setting {}
export class Modal {}
export const Platform = {
	isWin: false,
	isMacOS: false,
	isLinux: true
};
