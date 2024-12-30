import { Injectable } from "@nestjs/common";
import { WebSocketType, WSClient } from "../types";
import { BaseWebSocketServer } from "../base/base-websocket-server";
import { encoding } from "lib0";
import { YMessageType, writeSyncStep1, encodeAwarenessUpdate } from "@nicestack/common";
import { getYDoc, closeConn, WSSharedDoc, messageListener, send } from "./ws-shared-doc";
@Injectable()
export class YjsServer extends BaseWebSocketServer {
    public get serverType(): WebSocketType {
        return WebSocketType.YJS;
    }
    public override handleConnection(
        connection: WSClient
    ): void {
        super.handleConnection(connection)
        try {
            connection.binaryType = 'arraybuffer';
            const doc = this.initializeDocument(connection, connection.roomId, true);
            this.setupConnectionHandlers(connection, doc);
            this.sendInitialSync(connection, doc);
        } catch (error: any) {
            this.logger.error(`Error in handleNewConnection: ${error.message}`, error.stack);
            connection.close();
        }
    }

    private initializeDocument(conn: WSClient, docName: string, gc: boolean) {
        const doc = getYDoc(docName, gc);

        doc.conns.set(conn, new Set());
        return doc;
    }

    private setupConnectionHandlers(connection: WSClient, doc: WSSharedDoc): void {
        connection.on('message', (message: ArrayBuffer) => {
            this.handleMessage(connection, doc, message);
        });
        connection.on('close', () => {
            this.handleClose(doc, connection);
        });
        connection.on('error', (error) => {
            this.logger.error(`WebSocket error for doc ${doc.name}: ${error.message}`, error.stack);
            closeConn(doc, connection);
            this.logger.warn(`Connection closed due to error for doc: ${doc.name}. Remaining connections: ${doc.conns.size}`);
        });
    }

    private handleClose(doc: WSSharedDoc, connection: WSClient): void {
        try {
            closeConn(doc, connection);
        } catch (error: any) {
            this.logger.error(`Error closing connection: ${error.message}`, error.stack);
        }
    }
    private handleMessage(connection: WSClient, doc: WSSharedDoc, message: ArrayBuffer): void {
        try {
            messageListener(connection, doc, new Uint8Array(message));
        } catch (error: any) {
            this.logger.error(`Error handling message: ${error.message}`, error.stack);
        }
    }
    private sendInitialSync(connection: WSClient, doc: any): void {
        this.sendSyncStep1(connection, doc);
        this.sendAwarenessStates(connection, doc);
    }
    private sendSyncStep1(connection: WSClient, doc: any): void {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, YMessageType.Sync);
        writeSyncStep1(encoder, doc);
        send(doc, connection, encoding.toUint8Array(encoder));
    }
    private sendAwarenessStates(connection: WSClient, doc: WSSharedDoc): void {
        const awarenessStates = doc.awareness.getStates();

        if (awarenessStates.size > 0) {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, YMessageType.Awareness);
            encoding.writeVarUint8Array(
                encoder,
                encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys()))
            );
            send(doc, connection, encoding.toUint8Array(encoder));
        }
    }
}
