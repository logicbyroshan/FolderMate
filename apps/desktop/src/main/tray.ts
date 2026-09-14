import { app, Menu, Tray, nativeImage, BrowserWindow, shell } from "electron";
import path from "path";
import { FolderMateIPCClient } from "@foldermate/shared";

const trayIconPath = path.resolve(__dirname, "../../build/icon.ico");

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private ipcClient: FolderMateIPCClient | null = null;
  private isWatcherPaused: boolean = false;

  constructor(window: BrowserWindow, ipcClient: FolderMateIPCClient) {
    this.mainWindow = window;
    this.ipcClient = ipcClient;
    this.initializeTray();
  }

  private initializeTray(): void {
    const icon = nativeImage.createFromPath(trayIconPath);
    this.tray = new Tray(icon);
    this.tray.setToolTip("FolderMate — Your files organize themselves");

    this.updateContextMenu();

    this.tray.on("double-click", () => {
      this.showWindow();
    });
  }

  public updateContextMenu(): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "FolderMate v1.0.0",
        enabled: false,
      },
      { type: "separator" },
      {
        label: "Open Dashboard",
        click: () => this.showWindow(),
      },
      {
        label: "Scan Inbox Now",
        click: async () => {
          try {
            await this.ipcClient?.call("system.triggerScan");
          } catch (err) {
            console.error("Trigger scan failed:", err);
          }
        },
      },
      { type: "separator" },
      {
        label: this.isWatcherPaused ? "▶ Resume File Watcher" : "⏸ Pause File Watcher",
        click: () => {
          this.isWatcherPaused = !this.isWatcherPaused;
          this.updateContextMenu();
        },
      },
      {
        label: "Open Inbox Folder",
        click: async () => {
          try {
            const status = await this.ipcClient?.call("system.getStatus");
            if (status?.inboxPath) {
              shell.openPath(status.inboxPath);
            }
          } catch {}
        },
      },
      {
        label: "Open Storage Root",
        click: async () => {
          try {
            const status = await this.ipcClient?.call("system.getStatus");
            if (status?.organizationRoot) {
              shell.openPath(status.organizationRoot);
            }
          } catch {}
        },
      },
      { type: "separator" },
      {
        label: "Exit FolderMate",
        click: () => {
          (app as any).isQuitting = true;
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  public showWindow(): void {
    if (this.mainWindow) {
      if (!this.mainWindow.isVisible()) {
        this.mainWindow.show();
      }
      this.mainWindow.focus();
    }
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
