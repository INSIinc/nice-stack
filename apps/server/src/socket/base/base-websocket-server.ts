
import { WebSocketServer, WebSocket } from "ws";
import { Logger } from "@nestjs/common";
import { WebSocketServerConfig, WSClient, WebSocketType } from "../types";
import { SocketMessage } from '@nicestack/common';

const DEFAULT_CONFIG: WebSocketServerConfig = {
    pingInterval: 30000,
    pingTimeout: 5000,
    debug: false, // 新增默认调试配置
};
interface IWebSocketServer {
    start(): Promise<void>;
    stop(): Promise<void>;
    broadcast(data: any): void;
    handleConnection(ws: WSClient): void;
    handleDisconnection(ws: WSClient): void;
}

export abstract class BaseWebSocketServer implements IWebSocketServer {
    private _wss: WebSocketServer | null = null;
    protected clients: Set<WSClient> = new Set();
    protected timeouts: Map<WSClient, NodeJS.Timeout> = new Map();
    protected pingIntervalId?: NodeJS.Timeout;
    protected readonly logger = new Logger(this.constructor.name);
    protected readonly finalConfig: WebSocketServerConfig;
    private userClientMap: Map<string, WSClient> = new Map();
    constructor(
        protected readonly config: Partial<WebSocketServerConfig> = {}
    ) {
        this.finalConfig = {
            ...DEFAULT_CONFIG,
            ...config,
        };
    }
    protected debugLog(message: string, ...optionalParams: any[]): void {
        if (this.finalConfig.debug) {
            this.logger.debug(message, ...optionalParams);
        }
    }
    public getClientCount() {
        return this.clients.size
    }
    // 暴露 WebSocketServer 实例的只读访问
    public get wss(): WebSocketServer | null {
        return this._wss;
    }

    // 内部使用的 setter
    protected set wss(value: WebSocketServer | null) {
        this._wss = value;
    }

    public abstract get serverType(): WebSocketType;

    public get serverPath(): string {
        return this.finalConfig.path || `/${this.serverType}`;
    }

    public async start(): Promise<void> {
        if (this._wss) await this.stop();

        this._wss = new WebSocketServer({
            noServer: true,
            path: this.serverPath
        });

        this.debugLog(`WebSocket server starting on path: ${this.serverPath}`);
        this.setupServerEvents();
        this.startPingInterval();
    }

    public async stop(): Promise<void> {
        if (this.pingIntervalId) {
            clearInterval(this.pingIntervalId);
            this.pingIntervalId = undefined;
        }

        this.clients.forEach(client => client.close());
        this.clients.clear();
        this.timeouts.clear();

        if (this._wss) {
            await new Promise(resolve => this._wss!.close(resolve));
            this._wss = null;
        }

        this.debugLog(`WebSocket server stopped on path: ${this.serverPath}`);
    }

    public broadcast(data: SocketMessage): void {
        this.clients.forEach(client =>
            client.readyState === WebSocket.OPEN && client.send(JSON.stringify(data))
        );
    }
    public sendToUser(id: string, data: SocketMessage) {
        const message = JSON.stringify(data);
        const client = this.userClientMap.get(id);
        client?.send(message)
    }
    public sendToUsers(ids: string[], data: SocketMessage) {
        const message = JSON.stringify(data);
        ids.forEach(id => {
            const client = this.userClientMap.get(id);
            client?.send(message);
        });
    }
    public sendToRoom(roomId: string, data: SocketMessage) {
        const message = JSON.stringify(data);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
                client.send(message)
            }
        })
    }
    protected getRoomClientsCount(roomId?: string): number {
        if (!roomId) return 0;
        return Array.from(this.clients).filter(client => client.roomId === roomId).length;
    }

    public handleConnection(ws: WSClient): void {
        if (ws.userId) {
            this.userClientMap.set(ws.userId, ws);
        }
        ws.isAlive = true;
        ws.type = this.serverType;
        this.clients.add(ws);
        this.setupClientEvents(ws);

        const roomClientsCount = this.getRoomClientsCount(ws.roomId);
        this.debugLog(`
            [${this.serverType}] connected
            userId ${ws.userId} 
            roomId ${ws.roomId}
            room clients ${roomClientsCount}
            total clients ${this.clients.size}`);
    }

    public handleDisconnection(ws: WSClient): void {
        if (ws.userId) {
            this.userClientMap.delete(ws.userId);
        }
        this.clients.delete(ws);
        const timeout = this.timeouts.get(ws);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(ws);
        }
        ws.terminate();

        const roomClientsCount = this.getRoomClientsCount(ws.roomId);

        this.debugLog(`
            [${this.serverType}] disconnected 
            userId ${ws.userId} 
            roomId ${ws.roomId}
            room clients ${roomClientsCount}
            total clients ${this.clients.size}`);
    }
    protected setupClientEvents(ws: WSClient): void {
        ws.on('pong', () => this.handlePong(ws))
            .on('close', () => this.handleDisconnection(ws))
            .on('error', (error) => {
                this.logger.error(`[${this.serverType}] client error on path ${this.serverPath}:`, error);
                this.handleDisconnection(ws);
            });
    }

    private handlePong(ws: WSClient): void {
        ws.isAlive = true;
        const timeout = this.timeouts.get(ws);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(ws);
        }
    }

    private startPingInterval(): void {
        this.pingIntervalId = setInterval(
            () => this.pingClients(),
            this.finalConfig.pingInterval
        );
    }

    private pingClients(): void {
        this.clients.forEach(ws => {
            if (!ws.isAlive) return this.handleDisconnection(ws);

            ws.isAlive = false;
            ws.ping();
            const timeout = setTimeout(
                () => !ws.isAlive && this.handleDisconnection(ws),
                this.finalConfig.pingTimeout
            );
            this.timeouts.set(ws, timeout);
        });
    }

    protected setupServerEvents(): void {
        if (!this._wss) return;
        this._wss
            .on('connection', (ws: WSClient) => this.handleConnection(ws))
            .on('error', (error) => this.logger.error(`Server error on path ${this.serverPath}:`, error));
    }
}
