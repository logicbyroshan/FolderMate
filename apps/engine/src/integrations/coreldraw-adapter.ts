import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export interface CorelStatusResult {
  success: boolean;
  isRunning: boolean;
  version?: string;
  hasActiveDocument?: boolean;
  activeDocument?: {
    title: string;
    fullPath: string;
    isDirty: boolean;
    pageCount: number;
  } | null;
  message?: string;
  error?: string;
}

export interface CdrInspectionResult {
  success: boolean;
  isCdrPackage: boolean;
  filePath: string;
  fileSizeBytes: number;
  title: string;
  keywords?: string;
  creator?: string;
  pageCount: number;
  hasThumbnail: boolean;
  inspectedAt?: string;
  error?: string;
}

export interface SaveAsResult {
  success: boolean;
  savedPath?: string;
  fileSizeBytes?: number;
  error?: string;
}

export class CorelDrawAdapter {
  private bridgePath: string | null = null;
  private isDllMode: boolean = false;
  private timeoutMs: number;

  constructor(customBridgePath?: string, timeoutMs: number = 10000) {
    this.timeoutMs = timeoutMs;
    this.resolveBridgePath(customBridgePath);
  }

  public async getStatus(): Promise<CorelStatusResult> {
    if (!this.bridgePath) {
      return {
        success: true,
        isRunning: false,
        message: "CorelDRAW CLI bridge binary not built; offline mode active",
      };
    }

    try {
      const output = await this.executeBridge(["status"]);
      return JSON.parse(output);
    } catch (err: any) {
      return {
        success: false,
        isRunning: false,
        error: err.message,
      };
    }
  }

  public async saveAsNewVersion(targetPath: string): Promise<SaveAsResult> {
    if (!this.bridgePath) {
      throw new Error("CorelDRAW COM bridge is not available");
    }

    const output = await this.executeBridge(["save-as", targetPath]);
    return JSON.parse(output);
  }

  public async inspectCdrPackage(filePath: string): Promise<CdrInspectionResult> {
    if (this.bridgePath) {
      try {
        const output = await this.executeBridge(["inspect-cdr", filePath]);
        return JSON.parse(output);
      } catch {
        // fall back to node inspection
      }
    }

    if (!fs.existsSync(filePath)) {
      return { success: false, isCdrPackage: false, filePath, fileSizeBytes: 0, title: "", pageCount: 0, hasThumbnail: false, error: "File not found" };
    }

    const stats = fs.statSync(filePath);
    return {
      success: true,
      isCdrPackage: true,
      filePath,
      fileSizeBytes: stats.size,
      title: path.parse(filePath).name,
      pageCount: 1,
      hasThumbnail: false,
    };
  }

  public async extractThumbnail(sourceCdr: string, outPng: string): Promise<{ success: boolean; error?: string }> {
    if (!this.bridgePath) {
      return { success: false, error: "CorelDRAW bridge not available" };
    }

    const output = await this.executeBridge(["extract-thumbnail", sourceCdr, outPng]);
    return JSON.parse(output);
  }

  private resolveBridgePath(custom?: string): void {
    if (custom && fs.existsSync(custom)) {
      this.bridgePath = custom;
      this.isDllMode = custom.endsWith(".dll");
      return;
    }

    const candidates = [
      "bridges/coreldraw-bridge/bin/Release/net10.0-windows/FolderMate.CorelBridge.exe",
      "bridges/coreldraw-bridge/bin/Release/net10.0-windows/FolderMate.CorelBridge.dll",
      "bridges/coreldraw-bridge/bin/Release/net8.0-windows/FolderMate.CorelBridge.exe",
      "bridges/coreldraw-bridge/bin/Release/net8.0-windows/FolderMate.CorelBridge.dll",
      "bridges/coreldraw-bridge/bin/Debug/net10.0-windows/FolderMate.CorelBridge.dll",
    ];

    for (const rel of candidates) {
      const full = path.resolve(process.cwd(), rel);
      if (fs.existsSync(full)) {
        this.bridgePath = full;
        this.isDllMode = full.endsWith(".dll");
        return;
      }
    }
  }

  private executeBridge(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.bridgePath) {
        return reject(new Error("CorelDRAW bridge path not resolved"));
      }

      const cmd = this.isDllMode ? "dotnet" : this.bridgePath;
      const cmdArgs = this.isDllMode ? [this.bridgePath, ...args] : args;

      const child = spawn(cmd, cmdArgs, {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let isTimedOut = false;

      const timer = setTimeout(() => {
        isTimedOut = true;
        child.kill("SIGKILL");
        reject(new Error(`CorelDRAW Bridge timed out after ${this.timeoutMs}ms (possible modal dialog blocking COM)`));
      }, this.timeoutMs);

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString("utf8");
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString("utf8");
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (isTimedOut) return;

        if (code !== 0 && !stdout) {
          return reject(new Error(`CorelDRAW bridge exited with code ${code}: ${stderr}`));
        }

        resolve(stdout.trim());
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
