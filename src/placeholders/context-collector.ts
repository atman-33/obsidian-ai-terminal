import {TFile, App} from "obsidian";
import {ExecutionContext} from "../types";

/**
 * Collect execution context from various sources
 */
export class ContextCollector {
	constructor(private app: App) {}

	/**
	 * Normalize path separators for Windows
	 * Converts forward slashes to backslashes on Windows
	 */
	private normalizePath(path: string): string {
		// Detect Windows path (starts with drive letter)
		if (/^[A-Za-z]:/.test(path)) {
			return path.replace(/\//g, "\\");
		}
		return path;
	}

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
		
		// Use getBasePath + relative path for reliable filesystem path
		if ('getBasePath' in adapter && typeof adapter.getBasePath === 'function') {
			const basePath = adapter.getBasePath();
			const fullPath = basePath + "/" + file.path;
			return this.normalizePath(fullPath);
		}
		
		// Fallback: check if getFilePath exists and convert file:// URI to path
		if ('getFilePath' in adapter && typeof adapter.getFilePath === 'function') {
			const fileUri = adapter.getFilePath(file.path);
			// Remove file:// protocol if present
			if (fileUri.startsWith('file://')) {
				// file:///C:/path -> C:/path
				return fileUri.replace(/^file:\/\/\//, '').replace(/^file:\/\//, '');
			}
			return fileUri;
		}
		
		// Last resort: use vault path
		return file.path;
	}

	/**
	 * Get vault path
	 */
	getVaultPath(): string {
		const adapter = this.app.vault.adapter;
		
		if ('getBasePath' in adapter && typeof adapter.getBasePath === 'function') {
			const basePath = adapter.getBasePath();
			return this.normalizePath(basePath);
		}
		
		return "";
	}

	/**
	 * Get directory path from file
	 */
	getDirectoryPath(file: TFile): string {
		const fullPath = this.getFilePath(file);
		// After normalization, paths use backslash on Windows, forward slash on Unix
		const lastSlash = Math.max(fullPath.lastIndexOf("/"), fullPath.lastIndexOf("\\"));
		const dirPath = lastSlash > 0 ? fullPath.substring(0, lastSlash) : fullPath;
		return this.normalizePath(dirPath);
	}

	/**
	 * Get relative path from vault root
	 */
	getRelativePath(file: TFile): string {
		return file.path;
	}
}
