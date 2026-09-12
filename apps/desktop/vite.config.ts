import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  base: "./",
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@foldermate/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@foldermate/config": path.resolve(__dirname, "../../packages/config/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
