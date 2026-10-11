import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const EXCLUDE = ["node_modules/**", ".next/**", ".agents/**"];

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "logique",
          include: ["**/__tests__/**/*.test.ts"],
          exclude: EXCLUDE,
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "ecrans",
          include: ["**/__tests__/**/*.test.tsx"],
          exclude: EXCLUDE,
          environment: "jsdom",
          setupFiles: ["./test/setup-dom.ts"],
        },
      },
    ],
  },
});
