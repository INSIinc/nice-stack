import { Ref } from "react";
import {SocketMessage} from "@nicestack/common"
export enum ReadyState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3,
}

export enum CloseCode {
    NORMAL = 1000,
    ABNORMAL = 1006,
    SERVICE_RESTART = 1012,
    TRY_AGAIN_LATER = 1013,
}

export interface RetryConfig {
    initialRetryDelay: number;
    maxRetryDelay: number;
    maxRetryAttempts: number;
    jitter: number;
}

export interface WebSocketOptions {
    url: string;
    params?: Record<string, string>;
    protocols?: string | string[];
    manualConnect?: boolean;
    retryOnError?: boolean;
    onOpen?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onMessage?: (event: SocketMessage) => void;
    onError?: (event: Event) => void;
    onReconnect?: (count: number) => void;
    onMaxRetries?: () => void;
}

export interface WebSocketResult {
    ws: WebSocket | null;
    readyState: ReadyState;
    retryCountRef: Ref<number>;
    send: (message: unknown) => Promise<void>;
    connect: () => Promise<void>;
    disconnect: () => void;
    reconnect: () => Promise<void>;
}
