import { RetryConfig, WebSocketOptions, WebSocketResult, ReadyState, CloseCode } from './types';
import { SocketMessage } from '@nicestack/common';

const DEFAULT_CONFIG: RetryConfig = {
    initialRetryDelay: 1000,
    maxRetryDelay: 30000,
    maxRetryAttempts: 10,
    jitter: 0.1
};

const DEFAULT_OPTIONS: Partial<WebSocketOptions> = {
    retryOnError: true,
};

export class WebSocketClient<T = any> {
    private ws: WebSocket | null = null;
    private readyState: ReadyState = ReadyState.CLOSED;
    private retryCount = 0;
    private reconnectTimer?: NodeJS.Timeout;
    private messageQueue: unknown[] = [];
    private destroyed = false;

    private options: WebSocketOptions & Partial<RetryConfig>;
    private config: RetryConfig;

    constructor(options: WebSocketOptions & Partial<RetryConfig>) {
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };

        this.config = {
            ...DEFAULT_CONFIG,
            ...options,
        };

        if (!this.options.manualConnect) {
            this.connect();
        }
    }

    private getWebSocketUrl(): string {
        if (!this.options.url) throw new Error('WebSocket URL is required');
        const baseUrl = this.options.url;
        const params = this.options.params || {};
        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        return queryString
            ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}`
            : baseUrl;
    }

    private getNextRetryDelay(): number {
        const { initialRetryDelay, maxRetryDelay, jitter } = this.config;
        const baseDelay = Math.min(
            initialRetryDelay * Math.pow(2, this.retryCount),
            maxRetryDelay
        );
        const randomOffset = baseDelay * jitter * (Math.random() * 2 - 1);
        return Math.max(0, Math.floor(baseDelay + randomOffset));
    }

    public send(message: unknown): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== ReadyState.OPEN) {
                console.warn('[WebSocket] Cannot send message - connection not open');
                this.messageQueue.push(message);
                reject(new Error('WebSocket is not connected or not open'));
                return;
            }

            try {
                const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
                console.debug('[WebSocket] Sending message:', messageStr);
                this.ws.send(messageStr);
                resolve();
            } catch (error) {
                console.error('[WebSocket] Failed to send message:', error);
                reject(error);
            }
        });
    }

    private flushMessageQueue = async () => {
        if (this.ws?.readyState === ReadyState.OPEN) {
            const messages = [...this.messageQueue];
            this.messageQueue = [];
            for (const message of messages) {
                try {
                    await this.send(message);
                } catch (error) {
                    this.messageQueue.push(message);
                }
            }
        }
    }

    private createWebSocket = async () => {
        try {
            console.log(`[WebSocket] Attempting to connect to ${this.getWebSocketUrl()}`);
            const socket = new WebSocket(this.getWebSocketUrl(), this.options.protocols);
            this.readyState = ReadyState.CONNECTING;

            socket.onopen = (event: Event) => {
                console.log('[WebSocket] Connection established successfully');
                this.ws = socket;
                this.readyState = ReadyState.OPEN;
                this.retryCount = 0;
                this.flushMessageQueue();
                this.options.onOpen?.(event);
            };

            socket.onclose = (event: CloseEvent) => {
                console.log(`[WebSocket] Connection closed with code: ${event.code}, reason: ${event.reason}`);
                this.readyState = ReadyState.CLOSED;
                this.options.onClose?.(event);

                if (!this.destroyed && this.options.retryOnError && event.code !== CloseCode.NORMAL) {
                    console.log('[WebSocket] Abnormal closure, attempting to reconnect...');
                    this.handleReconnect();
                }
            };

            socket.onerror = (event: Event) => {
                console.error('[WebSocket] Error occurred:', event);
                this.options.onError?.(event);
            };

            socket.onmessage = (event: MessageEvent<SocketMessage<T>>) => {
                console.debug('[WebSocket] Message received:', event.data);
                let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                this.options.onMessage?.(data);
            };

            this.ws = socket;
            return socket;
        } catch (error) {
            console.error('[WebSocket] Failed to create connection:', error);
            throw error;
        }
    }

    private handleReconnect = async () => {
        if (this.destroyed) {
            console.log('[WebSocket] Instance destroyed, skipping reconnection');
            return;
        }

        if (this.retryCount >= this.config.maxRetryAttempts) {
            console.warn(`[WebSocket] Max retry attempts (${this.config.maxRetryAttempts}) reached`);
            this.options.onMaxRetries?.();
            return;
        }

        if (this.reconnectTimer) {
            console.log('[WebSocket] Reconnection already in progress');
            return;
        }

        const delay = this.getNextRetryDelay();
        console.log(`[WebSocket] Scheduling reconnection attempt ${this.retryCount + 1}/${this.config.maxRetryAttempts} in ${delay}ms`);

        this.reconnectTimer = setTimeout(async () => {
            try {
                this.retryCount++;
                if (this.ws) {
                    console.log('[WebSocket] Closing existing connection before reconnect');
                    this.ws.close();
                    this.ws = null;
                }

                await this.createWebSocket();
                console.log(`[WebSocket] Reconnection attempt ${this.retryCount + 1} successful`);
                this.options.onReconnect?.(this.retryCount + 1);
            } catch (error) {
                console.error(`[WebSocket] Reconnection attempt ${this.retryCount + 1} failed:`, error);
                await this.handleReconnect();
            } finally {
                this.reconnectTimer = undefined;
            }
        }, delay);
    }

    public connect = async () => {
        if (this.ws || this.destroyed) return;
        try {
            await this.createWebSocket();
        } catch (error) {
            if (this.options.retryOnError) {
                await this.handleReconnect();
            }
        }
    }

    public reconnect = async () => {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        await this.handleReconnect();
    }

    public disconnect = () => {
        this.destroyed = true;
        if (this.reconnectTimer) {
            console.log('[WebSocket] Clearing reconnect timer');
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        if (this.ws) {
            console.log('[WebSocket] Closing connection');
            this.ws.close(CloseCode.NORMAL);
            this.ws = null;
        }
        this.retryCount = 0;
        this.messageQueue = [];
    }

    // Getters
    public getWs(): WebSocket | null {
        return this.ws;
    }

    public getReadyState(): ReadyState {
        return this.readyState;
    }

    public getRetryCount(): number {
        return this.retryCount;
    }
}
