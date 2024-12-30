import { Injectable, Logger } from "@nestjs/common";
import { Server } from "http";
import { WSClient } from "./types";
import { RealtimeServer } from "./realtime/realtime.server";
import { YjsServer } from "./collaboration/yjs.server";
import { BaseWebSocketServer } from "./base/base-websocket-server";

@Injectable()
export class WebSocketService {
    private readonly logger = new Logger(WebSocketService.name);
    private readonly servers: BaseWebSocketServer[] = [];
    constructor(
        private realTimeServer: RealtimeServer,
        private yjsServer: YjsServer
    ) {
        this.servers.push(this.realTimeServer)
        this.servers.push(this.yjsServer)
    }
    public async initialize(httpServer: Server): Promise<void> {
        try {
            await Promise.all(this.servers.map(server => server.start()));
            this.setupUpgradeHandler(httpServer);
        } catch (error) {
            this.logger.error('Failed to initialize:', error);
            throw error;
        }
    }
    private setupUpgradeHandler(httpServer: Server): void {
        if (httpServer.listeners('upgrade').length) return;
        httpServer.on('upgrade', async (request, socket, head) => {
            try {
                const url = new URL(request.url!, `http://${request.headers.host}`);
                const pathname = url.pathname;

                // 从URL查询参数中获取roomId和token
                const urlParams = new URLSearchParams(url.search);
                const roomId = urlParams.get('roomId');
                const userId = urlParams.get('userId');
                const server = this.servers.find(server => {
                    const serverPathClean = server.serverPath.replace(/\/$/, '');
                    const pathnameClean = pathname.replace(/\/$/, '');
                    return serverPathClean === pathnameClean;
                });

                if (!server || !server.wss) {
                    return socket.destroy();
                }

                server.wss!.handleUpgrade(request, socket, head, (ws: WSClient) => {
                    ws.userId = userId;
                    ws.origin = request.url
                    ws.roomId = roomId
                    server.wss!.emit('connection', ws, request);
                });
            } catch (error) {
                this.logger.error('Upgrade error:', error);
                socket.destroy();
            }
        });
    }
}
