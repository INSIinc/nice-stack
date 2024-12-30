import { readSyncMessage } from '@nicestack/common';
import { applyAwarenessUpdate, Awareness, encodeAwarenessUpdate, removeAwarenessStates, writeSyncStep1, writeUpdate } from '@nicestack/common';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as Y from "yjs"
import { debounce } from 'lodash';
import { getPersistence, setPersistence } from './persistence';
import { callbackHandler, isCallbackSet } from './callback';
import { WebSocket } from "ws";
import { YMessageType } from '@nicestack/common';
import { WSClient } from '../types';
export const docs = new Map<string, WSSharedDoc>();
export const CALLBACK_DEBOUNCE_WAIT = parseInt(process.env.CALLBACK_DEBOUNCE_WAIT || '2000');
export const CALLBACK_DEBOUNCE_MAXWAIT = parseInt(process.env.CALLBACK_DEBOUNCE_MAXWAIT || '10000');
export const getYDoc = (docname: string, gc = true): WSSharedDoc => {
    return docs.get(docname) || createYDoc(docname, gc);
};
const createYDoc = (docname: string, gc: boolean): WSSharedDoc => {
    const doc = new WSSharedDoc(docname, gc);
    docs.set(docname, doc);
    return doc;
};

export const send = (doc: WSSharedDoc, conn: WebSocket, m: Uint8Array) => {
    if (conn.readyState !== WebSocket.OPEN) {
        closeConn(doc, conn);
        return;
    }
    try {
        conn.send(m, {}, err => { err != null && closeConn(doc, conn) });
    } catch (e) {
        closeConn(doc, conn);
    }
};
export const closeConn = (doc: WSSharedDoc, conn: WebSocket) => {
    if (doc.conns.has(conn)) {
        const controlledIds = doc.conns.get(conn) as Set<number>;
        doc.conns.delete(conn);
        removeAwarenessStates(
            doc.awareness,
            Array.from(controlledIds),
            null
        );

        if (doc.conns.size === 0 && getPersistence() !== null) {
            getPersistence()?.writeState(doc.name, doc).then(() => {
                doc.destroy();
            });
            docs.delete(doc.name);
        }
    }
    conn.close();
};

export const messageListener = (conn: WSClient, doc: WSSharedDoc, message: Uint8Array) => {
    try {
        const encoder = encoding.createEncoder();
        const decoder = decoding.createDecoder(message);
        const messageType = decoding.readVarUint(decoder);
        switch (messageType) {
            case YMessageType.Sync:
                // console.log(`received sync message ${message.length}`)
                encoding.writeVarUint(encoder, YMessageType.Sync);
                readSyncMessage(decoder, encoder, doc, conn);
                if (encoding.length(encoder) > 1) {
                    send(doc, conn, encoding.toUint8Array(encoder));
                }
                break;

            case YMessageType.Awareness: {
                applyAwarenessUpdate(
                    doc.awareness,
                    decoding.readVarUint8Array(decoder),
                    conn
                );
                // console.log(`received awareness message from ${conn.origin} total ${doc.awareness.states.size}`)
                break;
            }
        }
    } catch (err) {
        console.error(err);
        doc.emit('error' as any, [err]);
    }
};

const updateHandler = (update: Uint8Array, _origin: any, doc: WSSharedDoc, _tr: any) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, YMessageType.Sync);
    writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);
    doc.conns.forEach((_, conn) => send(doc, conn, message));
};

let contentInitializor: (ydoc: Y.Doc) => Promise<void> = (_ydoc) => Promise.resolve();
export const setContentInitializor = (f: (ydoc: Y.Doc) => Promise<void>) => {
    contentInitializor = f;
};

export class WSSharedDoc extends Y.Doc {
    name: string;
    conns: Map<WebSocket, Set<number>>;
    awareness: Awareness;
    whenInitialized: Promise<void>;

    constructor(name: string, gc: boolean) {
        super({ gc });

        this.name = name;
        this.conns = new Map();
        this.awareness = new Awareness(this);
        this.awareness.setLocalState(null);

        const awarenessUpdateHandler = ({
            added,
            updated,
            removed
        }: {
            added: number[],
            updated: number[],
            removed: number[]
        }, conn: WebSocket) => {
            const changedClients = added.concat(updated, removed);
            if (changedClients.length === 0) return
            if (conn !== null) {
                const connControlledIDs = this.conns.get(conn) as Set<number>;
                if (connControlledIDs !== undefined) {
                    added.forEach(clientID => { connControlledIDs.add(clientID); });
                    removed.forEach(clientID => { connControlledIDs.delete(clientID); });
                }
            }

            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, YMessageType.Awareness);
            encoding.writeVarUint8Array(
                encoder,
                encodeAwarenessUpdate(this.awareness, changedClients)
            );
            const buff = encoding.toUint8Array(encoder);

            this.conns.forEach((_, c) => {
                send(this, c, buff);
            });
        };

        this.awareness.on('update', awarenessUpdateHandler);
        this.on('update', updateHandler as any);

        if (isCallbackSet) {
            this.on('update', debounce(
                callbackHandler as any,
                CALLBACK_DEBOUNCE_WAIT,
                { maxWait: CALLBACK_DEBOUNCE_MAXWAIT }
            ) as any);
        }

        this.whenInitialized = contentInitializor(this);
    }
}
