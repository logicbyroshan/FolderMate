import net from "net";
import { EventEmitter } from "events";
import { AuthManager } from "./auth-manager.js";
import { dispatchRPCMethod, RPCContext } from "./rpc-dispatcher.js";
import { NAMED_PIPE_PATH } from "@foldermate/shared";

export interface IPCServerOptions {
  pipePath?: string;
  authManager: AuthManager;
  rpcContext: RPCContext;
}

export class IPCServer extends EventEmitter {
  private server: net.Server | null = null;
  private clients: Set<net.Socket> = new Set();
  private authenticatedClients: Set<net.Socket> = new Set();
  private authManager: AuthManager;
  private rpcContext: RPCContext;
  private pipePath: string;

  constructor(options: IPCServerOptions) {
    super();
    this.pipePath = options.pipePath || NAMED_PIPE_PATH;
    this.authManager = options.authManager;
    this.rpcContext = options.rpcContext;
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        this.handleClientConnection(socket);
      });

      this.server.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          // Clean up orphaned pipe on Windows/Unix if needed
          try {
            net.connect(this.pipePath, () => {
              this.emit("error", new Error(`Another FolderMate Engine instance is already active on ${this.pipePath}`));
              reject(err);
            }).on("error", () => {
              this.server?.listen(this.pipePath, () => resolve());
            });
          } catch {
            reject(err);
          }
        } else {
          reject(err);
        }
      });

      this.server.listen(this.pipePath, () => {
        this.emit("listening", { path: this.pipePath });
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const client of this.clients) {
        client.destroy();
      }
      this.clients.clear();
      this.authenticatedClients.clear();

      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public broadcastEvent(eventType: string, payload: any): void {
    const notification = JSON.stringify({
      jsonrpc: "2.0",
      method: "event",
      params: {
        eventType,
        payload,
        timestamp: new Date().toISOString(),
      },
    }) + "\n";

    for (const client of this.authenticatedClients) {
      try {
        client.write(notification);
      } catch {
        // Socket write error; ignore
      }
    }
  }

  private handleClientConnection(socket: net.Socket): void {
    this.clients.add(socket);

    let buffer = "";

    socket.on("data", async (chunk) => {
      buffer += chunk.toString("utf8");

      let delimiterIndex: number;
      while ((delimiterIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, delimiterIndex).trim();
        buffer = buffer.slice(delimiterIndex + 1);

        if (line.length > 0) {
          await this.processMessage(socket, line);
        }
      }
    });

    socket.on("close", () => {
      this.clients.delete(socket);
      this.authenticatedClients.delete(socket);
    });

    socket.on("error", () => {
      this.clients.delete(socket);
      this.authenticatedClients.delete(socket);
    });
  }

  private async processMessage(socket: net.Socket, rawMessage: string): Promise<void> {
    let req: any;
    try {
      req = JSON.parse(rawMessage);
    } catch {
      socket.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error" },
        }) + "\n"
      );
      return;
    }

    const { id, method, params } = req;

    // Handle initial handshake
    if (method === "auth.handshake") {
      const token = params?.token;
      if (this.authManager.validateToken(token)) {
        this.authenticatedClients.add(socket);
        socket.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: {
              authenticated: true,
              version: "1.0.0",
              inboxPath: this.rpcContext.config.ingestion.inboxPath,
              organizationRoot: this.rpcContext.config.storage.organizationRoot,
            },
          }) + "\n"
        );
      } else {
        socket.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: { code: -32000, message: "Authentication failed: invalid token" },
          }) + "\n"
        );
        socket.destroy();
      }
      return;
    }

    // Require authentication for all other methods
    if (!this.authenticatedClients.has(socket)) {
      socket.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          error: { code: -32000, message: "Unauthenticated: execute auth.handshake first" },
        }) + "\n"
      );
      return;
    }

    try {
      const result = await dispatchRPCMethod(method, params, this.rpcContext);
      socket.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          result,
        }) + "\n"
      );
    } catch (err: any) {
      socket.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          error: { code: 1000, message: err.message },
        }) + "\n"
      );
    }
  }
}
