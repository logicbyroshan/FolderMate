import { contextBridge, ipcRenderer } from "electron";

export interface FolderMateAPI {
  call: <T = any>(method: string, params?: any) => Promise<T>;
  openPath: (path: string) => Promise<string>;
  showItemInFolder: (path: string) => Promise<boolean>;
  onEvent: (callback: (event: any) => void) => () => void;
}

const api: FolderMateAPI = {
  call: (method, params) => ipcRenderer.invoke("foldermate:call", { method, params }),
  openPath: (path) => ipcRenderer.invoke("foldermate:openPath", path),
  showItemInFolder: (path) => ipcRenderer.invoke("foldermate:showItemInFolder", path),
  onEvent: (callback) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on("foldermate:event", handler);
    return () => ipcRenderer.removeListener("foldermate:event", handler);
  },
};

contextBridge.exposeInMainWorld("foldermate", api);
