import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@foldermate/shared": path.resolve(__dirname, "./packages/shared/src/index.ts"),
      "@foldermate/database": path.resolve(__dirname, "./packages/database/src/index.ts"),
      "@foldermate/config": path.resolve(__dirname, "./packages/config/src/index.ts"),
    },
  },
});
