import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import fs from "fs";
import { FolderMateIPCClient } from "@foldermate/shared";
import { getAppDataDir } from "@foldermate/config";
import { TrayManager } from "./tray.js";

let mainWindow: BrowserWindow | null = null;
let trayManager: TrayManager | null = null;
let ipcClient: FolderMateIPCClient | null = null;

async function getAuthToken(): Promise<string> {
  const tokenPath = path.join(getAppDataDir(), ".auth_token");
  if (fs.existsSync(tokenPath)) {
    return fs.readFileSync(tokenPath, "utf-8").trim();
  }
  return "";
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    frame: true,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#0f172a",
      symbolColor: "#94a3b8",
      height: 38,
    },
    backgroundColor: "#090d16",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Connect to FolderMate Background Daemon
  ipcClient = new FolderMateIPCClient();
  try {
    const token = await getAuthToken();
    await ipcClient.connect(token);
    console.log("[Electron Main] Connected to FolderMate Background Engine");
  } catch (err) {
    console.warn("[Electron Main] Engine not active or connecting failed:", err);
  }

  trayManager = new TrayManager(mainWindow, ipcClient);

  // Forward IPC server-sent events to renderer window
  ipcClient.on("event", (eventData: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("foldermate:event", eventData);
    }
  });

  // Handle Close -> Minimize to Tray
  mainWindow.on("close", (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

// Handle RPC calls from renderer via preload contextBridge
ipcMain.handle("foldermate:call", async (_event, { method, params }) => {
  if (!ipcClient) {
    throw new Error("FolderMate Engine IPC client is not initialized");
  }
  return await ipcClient.call(method, params);
});

ipcMain.handle("foldermate:openPath", async (_event, filePath: string) => {
  return await shell.openPath(filePath);
});

ipcMain.handle("foldermate:showItemInFolder", async (_event, filePath: string) => {
  shell.showItemInFolder(filePath);
  return true;
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // On Windows, keep running in background tray unless explicitly quitting
  if (process.platform !== "win32") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});
