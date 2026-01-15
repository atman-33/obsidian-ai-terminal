/**
 * Escape path for shell usage
 */
export function escapePathForShell(path: string): string {
	// For spaces and special characters
	if (path.includes(" ") || /[&|;<>()$`\\"]/.test(path)) {
		return `"${path.replace(/"/g, '\\"')}"`;
	}
	return path;
}
