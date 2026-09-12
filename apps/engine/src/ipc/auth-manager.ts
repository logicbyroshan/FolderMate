import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getAppDataDir } from "@foldermate/config";

export class AuthManager {
  private currentToken: string | null = null;
  private tokenFilePath: string;

  constructor(customTokenDir?: string) {
    const dir = customTokenDir || getAppDataDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.tokenFilePath = path.join(dir, ".auth_token");
  }

  public initializeToken(): string {
    this.currentToken = crypto.randomBytes(32).toString("hex");

    try {
      fs.writeFileSync(this.tokenFilePath, this.currentToken, {
        encoding: "utf-8",
        mode: 0o600, // Read/write only for owner
      });
    } catch (err) {
      console.warn("[AuthManager] Notice writing auth token:", err);
    }

    return this.currentToken;
  }

  public validateToken(candidate: string): boolean {
    if (!this.currentToken || !candidate) return false;
    try {
      return crypto.timingSafeEqual(
        Buffer.from(candidate, "utf-8"),
        Buffer.from(this.currentToken, "utf-8")
      );
    } catch {
      return false;
    }
  }

  public getToken(): string | null {
    return this.currentToken;
  }
}
