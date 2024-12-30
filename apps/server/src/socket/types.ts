import { WebSocketServer, WebSocket } from "ws";

// 类型定义
export enum WebSocketType {
    YJS = "yjs",
    REALTIME = "realtime"
}

export interface WebSocketServerConfig {
    path?: string;
    pingInterval?: number;
    pingTimeout?: number;
    debug?: boolean
}

export interface ServerInstance {
    wss: WebSocketServer | null;
    clients: Set<WSClient>;
    pingIntervalId?: NodeJS.Timeout;
    timeouts: Map<WebSocket, NodeJS.Timeout>;
}

export interface WSClient extends WebSocket {
    isAlive?: boolean;
    type?: WebSocketType;
    userId?: string
    origin?: string
    roomId?: string
}