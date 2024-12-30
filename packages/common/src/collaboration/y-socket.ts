import * as Y from 'yjs' // eslint-disable-line
import * as bc from 'lib0/broadcastchannel'
import * as time from 'lib0/time'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as syncProtocol from './y-sync'
import * as awarenessProtocol from './y-awareness'
import { Observable } from 'lib0/observable'
import * as math from 'lib0/math'
import * as url from 'lib0/url'
import * as env from 'lib0/environment'
import { MessageHandler, messageHandlers } from './y-handler'
import { YMessageType } from './types'
import { isReactNative } from './utils'

// const messageReconnectTimeout = awarenessProtocol.outdatedTimeout
const readMessage = (provider: YWsProvider, buf: Uint8Array, emitSynced: boolean): encoding.Encoder => {
    const decoder = decoding.createDecoder(buf)
    const encoder = encoding.createEncoder()
    const messageType = decoding.readVarUint(decoder)
    const messageHandler = provider.messageHandlers[messageType]
    if (messageHandler) {
        messageHandler(encoder, decoder, provider, emitSynced, messageType)
    } else {
        console.error('Unable to compute message')
    }
    return encoder
}

const setupSocket = (provider: YWsProvider) => {
    if (provider.shouldConnect && provider.socket === null) {
        const websocketUrl = provider.url.replace(/^http/, 'ws')
        // console.log(`Setting up WebSocket connection to ${websocketUrl}`)
        const socket = new WebSocket(websocketUrl)
        socket.binaryType = 'arraybuffer'
        provider.socket = socket
        provider.wsconnecting = true
        provider.wsconnected = false
        provider.synced = false

        socket.onmessage = (event) => {
            provider.wsLastMessageReceived = time.getUnixTime()
            const encoder = readMessage(provider, new Uint8Array(event.data), true)
            if (encoding.length(encoder) > 1) {
                socket.send(encoding.toUint8Array(encoder))
            }
        }


        socket.onerror = (error) => {
            console.log('WebSocket connection error:', error)
            provider.emit('connection-error', [error, provider])
        }

        socket.onclose = (event) => {
            console.log('WebSocket closed', event)
            provider.emit('connection-close', [event.reason, provider])
            provider.socket = null
            provider.wsconnecting = false

            if (provider.wsconnected) {
                provider.wsconnected = false
                provider.synced = false
                awarenessProtocol.removeAwarenessStates(
                    provider.awareness,
                    Array.from(provider.awareness.getStates().keys()).filter((client) =>
                        client !== provider.doc.clientID
                    ),
                    provider
                )
                provider.emit('status', [{
                    status: 'disconnected'
                }])
            } else {
                provider.wsUnsuccessfulReconnects++
            }

            // 重连逻辑
            setTimeout(
                () => setupSocket(provider),
                math.min(
                    math.pow(2, provider.wsUnsuccessfulReconnects) * 100,
                    provider.maxBackoffTime
                )
            )
        }
        socket.onopen = () => {
            console.log('\x1b[32m%s\x1b[0m', 'WebSocket connected')
            provider.wsLastMessageReceived = time.getUnixTime()
            provider.wsconnecting = false
            provider.wsconnected = true
            provider.wsUnsuccessfulReconnects = 0
            provider.emit('status', [{
                status: 'connected'
            }])

            // 发送初始同步数据
            const encoder = encoding.createEncoder()
            encoding.writeVarUint(encoder, YMessageType.Sync)
            syncProtocol.writeSyncStep1(encoder, provider.doc)
            socket.send(encoding.toUint8Array(encoder))

            // 发送awareness状态
            if (provider.awareness.getLocalState() !== null) {
                const encoderAwarenessState = encoding.createEncoder()
                encoding.writeVarUint(encoderAwarenessState, YMessageType.Awareness)
                encoding.writeVarUint8Array(
                    encoderAwarenessState,
                    awarenessProtocol.encodeAwarenessUpdate(provider.awareness, [
                        provider.doc.clientID
                    ])
                )
                socket.send(encoding.toUint8Array(encoderAwarenessState))
            }
        }
        provider.emit('status', [{
            status: 'connecting'
        }])
    }
}
const broadcastMessage = (provider: YWsProvider, buf: ArrayBuffer) => {
    // console.log(`Broadcasting message: ${new Uint8Array(buf)}`)
    if (provider.wsconnected && provider.socket) {
        provider.socket.send(buf)
        // console.log(`Document update detected, send to server: ${buf}`)
    }
    if (!isReactNative() && provider.bcconnected) {
        bc.publish(provider.bcChannel, buf, provider)
    }
}
export class YWsProvider extends Observable<string> {
    public serverUrl: string;
    public bcChannel: string;
    public maxBackoffTime: number;
    public params: Record<string, string>;
    public protocols: string[];
    public doc: Y.Doc;
    public roomId: string;
    public socket: WebSocket | null;
    public awareness: awarenessProtocol.Awareness;
    public wsconnected: boolean;
    public wsconnecting: boolean;
    public bcconnected: boolean;
    public disableBc: boolean;
    public wsUnsuccessfulReconnects: number;
    public messageHandlers: MessageHandler[];
    private _synced: boolean;
    public wsLastMessageReceived: number;
    public shouldConnect: boolean;
    private _resyncInterval: ReturnType<typeof setInterval>;
    // private _checkInterval: ReturnType<typeof setInterval>;
    private _bcSubscriber: (data: ArrayBuffer, origin: any) => void;
    private _updateHandler: (update: Uint8Array, origin: any) => void;
    private _awarenessUpdateHandler: (changed: { added: any; updated: any; removed: any }, _origin: any) => void;
    private _exitHandler: () => void;

    constructor(
        serverUrl: string,
        roomId: string,
        doc: Y.Doc,
        {
            connect = true,
            awareness = new awarenessProtocol.Awareness(doc),
            params = {},
            protocols = [],
            resyncInterval = -1,
            maxBackoffTime = 2500,
            disableBc = false
        }: {
            connect?: boolean,
            awareness?: awarenessProtocol.Awareness,
            params?: Record<string, string>,
            protocols?: string[],
            resyncInterval?: number,
            maxBackoffTime?: number,
            disableBc?: boolean
        } = {}
    ) {
        super()
        while (serverUrl[serverUrl.length - 1] === '/') {
            serverUrl = serverUrl.slice(0, serverUrl.length - 1)
        }
        this.serverUrl = serverUrl
        this.params = { ...params, roomId }
        this.bcChannel = serverUrl + '/' + roomId
        this.maxBackoffTime = maxBackoffTime
        this.protocols = protocols
        this.doc = doc
        this.socket = null
        this.awareness = awareness
        this.roomId = roomId
        this.wsconnected = false
        this.wsconnecting = false
        this.bcconnected = false
        this.disableBc = isReactNative() ? true : disableBc
        this.wsUnsuccessfulReconnects = 0
        this.messageHandlers = messageHandlers.slice()
        this._synced = false
        this.wsLastMessageReceived = 0
        this.shouldConnect = connect
        this._resyncInterval = 0 as unknown as ReturnType<typeof setInterval>;
        if (resyncInterval > 0) {
            this._resyncInterval = setInterval(() => {
                if (this.socket && this.socket.OPEN) {
                    const encoder = encoding.createEncoder()
                    encoding.writeVarUint(encoder, YMessageType.Sync)
                    syncProtocol.writeSyncStep1(encoder, doc)
                    console.log(`Resyncing data on interval: ${encoding.toUint8Array(encoder)}`)
                    this.socket.send(encoding.toUint8Array(encoder))
                }
            }, resyncInterval)
        }
        this._bcSubscriber = (data: ArrayBuffer, origin: any) => {
            if (origin !== this) {

                const encoder = readMessage(this, new Uint8Array(data), false)
                if (encoding.length(encoder) > 1) {
                    // console.log(`Broadcasting response on BroadcastChannel: ${encoding.toUint8Array(encoder)}`)
                    bc.publish(this.bcChannel, encoding.toUint8Array(encoder), this)
                }
            }
        }
        this._updateHandler = (update: Uint8Array, origin: any) => {

            if (origin !== this) {
                const encoder = encoding.createEncoder()
                encoding.writeVarUint(encoder, YMessageType.Sync)
                syncProtocol.writeUpdate(encoder, update)

                broadcastMessage(this, encoding.toUint8Array(encoder))
            }
        }
        this.doc.on('update', this._updateHandler)
        this._awarenessUpdateHandler = ({ added, updated, removed }: { added: any; updated: any; removed: any }, _origin: any) => {
            const changedClients = added.concat(updated).concat(removed)
            console.log(`update awareness from ${_origin}`, changedClients)
            const encoder = encoding.createEncoder()
            encoding.writeVarUint(encoder, YMessageType.Awareness)
            encoding.writeVarUint8Array(
                encoder,
                awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
            )
            // console.log(`Awareness update detected, broadcasting message: ${encoding.toUint8Array(encoder)}`)
            broadcastMessage(this, encoding.toUint8Array(encoder))
        }
        this._exitHandler = () => {
            awarenessProtocol.removeAwarenessStates(
                this.awareness,
                [doc.clientID],
                'app closed'
            )
            console.log('App closed, removing awareness states.')
        }
        if (env.isNode && typeof process !== 'undefined') {
            process.on('exit', this._exitHandler)
        }
        awareness.on('update', this._awarenessUpdateHandler)
        // this._checkInterval = setInterval(() => {
        //     if (
        //         this.wsconnected &&
        //         messageReconnectTimeout < time.getUnixTime() - this.wsLastMessageReceived
        //     ) {
        //         if (this.socket) {
        //             console.log('No message received for a while, disconnecting socket')
        //             this.socket.close()
        //         }
        //     }
        // }, messageReconnectTimeout / 10)
        if (connect) {
            this.connect()
        }
    }
    get url(): string {
        const encodedParams = url.encodeQueryParams(this.params)
        return this.serverUrl +
            (encodedParams.length === 0 ? '' : '?' + encodedParams)
    }
    get synced(): boolean {
        return this._synced
    }
    set synced(state: boolean) {
        if (this._synced !== state) {
            this._synced = state
            this.emit('synced', [state])
            this.emit('sync', [state])
            // console.log(`Synced state changed: ${state}`)
        }
    }

    destroy() {
        if (this._resyncInterval) {
            clearInterval(this._resyncInterval)
        }
        // if (this._checkInterval) {
        //     clearInterval(this._checkInterval)
        // }
        this.disconnect()
        if (env.isNode && typeof process !== 'undefined') {
            process.off('exit', this._exitHandler)
        }
        this.awareness.off('update', this._awarenessUpdateHandler)
        this.doc.off('update', this._updateHandler)
        console.log('Destroying provider and clearing intervals/subscriptions.')
        super.destroy()
    }

    connectBc() {
        if (isReactNative() || this.disableBc) {
            return
        }
        if (!this.bcconnected) {
            bc.subscribe(this.bcChannel, this._bcSubscriber)
            this.bcconnected = true
            // console.log(`Subscribed to BroadcastChannel: ${this.bcChannel}`)
        }
        const encoderSync = encoding.createEncoder()
        encoding.writeVarUint(encoderSync, YMessageType.Sync)
        syncProtocol.writeSyncStep1(encoderSync, this.doc)
        // console.log(`Connecting BroadcastChannel with syncStep1: ${encoding.toUint8Array(encoderSync)}`)
        bc.publish(this.bcChannel, encoding.toUint8Array(encoderSync), this)
        const encoderState = encoding.createEncoder()
        encoding.writeVarUint(encoderState, YMessageType.Sync)
        syncProtocol.writeSyncStep2(encoderState, this.doc)
        // console.log(`Connecting BroadcastChannel with syncStep2: ${encoding.toUint8Array(encoderState)}`)
        bc.publish(this.bcChannel, encoding.toUint8Array(encoderState), this)
        const encoderAwarenessQuery = encoding.createEncoder()
        encoding.writeVarUint(encoderAwarenessQuery, YMessageType.QueryAwareness)
        // console.log(`Connecting BroadcastChannel with awareness query: ${encoding.toUint8Array(encoderAwarenessQuery)}`)
        bc.publish(
            this.bcChannel,
            encoding.toUint8Array(encoderAwarenessQuery),
            this
        )
        const encoderAwarenessState = encoding.createEncoder()
        encoding.writeVarUint(encoderAwarenessState, YMessageType.Awareness)
        encoding.writeVarUint8Array(
            encoderAwarenessState,
            awarenessProtocol.encodeAwarenessUpdate(this.awareness, [
                this.doc.clientID
            ])
        )
        // console.log(`Connecting BroadcastChannel with awareness state: ${encoding.toUint8Array(encoderAwarenessState)}`)
        bc.publish(
            this.bcChannel,
            encoding.toUint8Array(encoderAwarenessState),
            this
        )
    }

    disconnectBc() {
        if (isReactNative()) {
            return
        }
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, YMessageType.Awareness)
        encoding.writeVarUint8Array(
            encoder,
            awarenessProtocol.encodeAwarenessUpdate(this.awareness, [
                this.doc.clientID
            ], new Map())
        )
        // console.log(`Disconnecting BroadcastChannel, clearing awareness state: ${encoding.toUint8Array(encoder)}`)
        broadcastMessage(this, encoding.toUint8Array(encoder))
        if (this.bcconnected) {
            bc.unsubscribe(this.bcChannel, this._bcSubscriber)
            this.bcconnected = false
            // console.log(`Unsubscribed from BroadcastChannel: ${this.bcChannel}`)
        }
    }

    disconnect() {
        this.shouldConnect = false
        this.disconnectBc()
        if (this.socket) {
            console.log('Disconnecting socket')
            this.socket.close()
        }
    }

    connect() {
        this.shouldConnect = true
        if (!this.wsconnected && this.socket === null) {

            setupSocket(this)
            this.connectBc()
        }
    }
}
