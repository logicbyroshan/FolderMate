import net from "net";
import { EventEmitter } from "events";
import { NAMED_PIPE_PATH } from "./constants.js";

export class FolderMateIPCClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private pendingRequests: Map<string, { resolve: (res: any) => void; reject: (err: any) => void }> = new Map();
  private requestId: number = 1;
  private pipePath: string;
  private buffer: string = "";

  constructor(customPipePath?: string) {
    super();
    this.pipePath = customPipePath || NAMED_PIPE_PATH;
  }

  public async connect(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket = net.connect(this.pipePath, async () => {
        this.emit("connected");
        try {
          const authRes = await this.call("auth.handshake", { token, clientVersion: "1.0.0" });
          resolve(authRes);
        } catch (err) {
          reject(err);
        }
      });

      this.socket.on("data", (chunk) => {
        this.buffer += chunk.toString("utf8");
        let delimiterIndex: number;
        while ((delimiterIndex = this.buffer.indexOf("\n")) !== -1) {
          const line = this.buffer.slice(0, delimiterIndex).trim();
          this.buffer = this.buffer.slice(delimiterIndex + 1);
          if (line.length > 0) {
            this.handleMessage(line);
          }
        }
      });

      this.socket.on("error", (err) => {
        this.emit("error", err);
        reject(err);
      });

      this.socket.on("close", () => {
        this.emit("disconnected");
        this.socket = null;
      });
    });
  }

  public async call<T = any>(method: string, params?: any): Promise<T> {
    if (!this.socket) {
      throw new Error("IPC Client not connected to FolderMate Engine");
    }

    const id = `req_${this.requestId++}`;
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params: params || {},
    }) + "\n";

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.socket!.write(payload);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }

  private handleMessage(raw: string): void {
    try {
      const msg = JSON.parse(raw);

      // 1. Server-sent event notification
      if (msg.method === "event" && msg.params) {
        this.emit("event", msg.params);
        this.emit(`event:${msg.params.eventType}`, msg.params.payload);
        return;
      }

      // 2. RPC response
      if (msg.id && this.pendingRequests.has(msg.id)) {
        const { resolve, reject } = this.pendingRequests.get(msg.id)!;
        this.pendingRequests.delete(msg.id);

        if (msg.error) {
          reject(new Error(msg.error.message || `RPC Error ${msg.error.code}`));
        } else {
          resolve(msg.result);
        }
      }
    } catch {
      // ignore malformed lines
    }
  }
}
