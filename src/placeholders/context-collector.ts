import {TFile, App} from "obsidian";
import {ExecutionContext} from "../types";

/**
 * Collect execution context from various sources
 */
export class ContextCollector {
	constructor(private app: App) {}

	/**
	 * Collect context from a file
	 */
	collectFileContext(file: TFile): Partial<ExecutionContext> {
		return {
			file,
			vault: this.app.vault
		};
	}

	/**
	 * Collect context from editor (includes file and selection)
	 */
	collectEditorContext(file: TFile | null, selection: string): Partial<ExecutionContext> {
		return {
			file: file ?? undefined,
			selection: selection || undefined,
			vault: this.app.vault
		};
	}

	/**
	 * Collect minimal vault context (no file)
	 */
	collectVaultContext(): Partial<ExecutionContext> {
		return {
			vault: this.app.vault
		};
	}

	/**
	 * Get file path from TFile
	 */
	getFilePath(file: TFile): string {
		const adapter = this.app.vault.adapter;
		const adapterRecord = adapter as unknown as Record<string, unknown>;
		if (typeof adapterRecord.getFullPath === "function") {
			const getFullPath = adapterRecord.getFullPath as (path: string) => string;
			return getFullPath(file.path);
		}
		// Fallback: combine basePath with file path
		const basePath = adapterRecord.basePath as string || "";
		return basePath + "/" + file.path;
	}

	/**
	 * Get vault path
	 */
	getVaultPath(): string {
		const adapter = this.app.vault.adapter;
		return (adapter as unknown as Record<string, unknown>).basePath as string || "";
	}

	/**
	 * Get directory path from file
	 */
	getDirectoryPath(file: TFile): string {
		const fullPath = this.getFilePath(file);
		const lastSlash = Math.max(fullPath.lastIndexOf("/"), fullPath.lastIndexOf("\\"));
		return lastSlash > 0 ? fullPath.substring(0, lastSlash) : fullPath;
	}

	/**
	 * Get relative path from vault root
	 */
	getRelativePath(file: TFile): string {
		return file.path;
	}
}
