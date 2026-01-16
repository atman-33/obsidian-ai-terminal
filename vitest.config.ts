import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.test.ts", "src/main.ts"]
		}
	},
	resolve: {
		alias: {
			obsidian: path.resolve(__dirname, "src/__mocks__/obsidian.ts")
		}
	}
});
