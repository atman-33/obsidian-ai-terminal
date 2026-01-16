import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { Linter } from "eslint";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
	{
		ignores: [
			"node_modules/**",
			"dist/**",
			"esbuild.config.mjs",
			"eslint.config.js",
			"version-bump.mjs",
			"versions.json",
			"main.js",
			".claude/**",
			".tmp/**",
			"vitest.config.ts",
		],
	},
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: tseslint.parser,
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'eslint.config.js',
						'manifest.json'
					]
				},
				tsconfigRootDir: __dirname,
				extraFileExtensions: ['.json']
			},
		},
		plugins: {
			obsidianmd: obsidianmd
		},
		rules: (obsidianmd.configs?.recommended || {}) as Linter.RulesRecord,
	},
);
