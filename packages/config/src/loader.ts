import fs from "fs";
import path from "path";
import os from "os";
import { FolderMateConfig, FolderMateConfigSchema } from "./schema.js";

export function getAppDataDir(): string {
  const appData = process.env.APPDATA || (
    process.platform === "darwin"
      ? path.join(os.homedir(), "Library", "Application Support")
      : path.join(os.homedir(), ".config")
  );
  return path.join(appData, "FolderMate");
}

export function getConfigFilePath(): string {
  return path.join(getAppDataDir(), "config.json");
}

export function loadConfig(customPath?: string): FolderMateConfig {
  const configPath = customPath || getConfigFilePath();

  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      const json = JSON.parse(raw);
      return FolderMateConfigSchema.parse(json);
    } catch (err) {
      console.warn(`[Config] Failed to parse config at ${configPath}, falling back to defaults:`, err);
    }
  }

  // Generate and return defaults
  return FolderMateConfigSchema.parse({});
}

export function saveConfig(config: FolderMateConfig, customPath?: string): void {
  const configPath = customPath || getConfigFilePath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const validated = FolderMateConfigSchema.parse(config);
  fs.writeFileSync(configPath, JSON.stringify(validated, null, 2), "utf-8");
}
