import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { YWsProvider } from './y-socket';
import { YMessageType } from './types';
import * as awarenessProtocol from './y-awareness'
import * as syncProtocol from './y-sync'
import * as authProtocol from './y-auth'
export type MessageHandler = (encoder: encoding.Encoder, decoder: decoding.Decoder, provider: YWsProvider, emitSynced: boolean, messageType: number) => void;

export const messageHandlers: MessageHandler[] = []

messageHandlers[YMessageType.Sync] = (
    encoder,
    decoder,
    provider,
    emitSynced,
    _messageType
) => {
    // console.log('Handling YMessageType.Sync')
    encoding.writeVarUint(encoder, YMessageType.Sync)
    const syncMessageType = syncProtocol.readSyncMessage(
        decoder,
        encoder,
        provider.doc,
        provider
    )
    // console.debug(`Sync message type: ${syncMessageType}`)
    if (
        emitSynced && syncMessageType === syncProtocol.messageYjsSyncStep2 &&
        !provider.synced
    ) {
        // console.log('Setting provider.synced to true')
        provider.synced = true
    }
}

messageHandlers[YMessageType.QueryAwareness] = (
    encoder,
    _decoder,
    provider,
    _emitSynced,
    _messageType
) => {
    console.log('Handling messageQueryAwareness')
    encoding.writeVarUint(encoder, YMessageType.Awareness)
    encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
            provider.awareness,
            Array.from(provider.awareness.getStates().keys())
        )
    )
    console.debug('Encoded awareness update for querying awareness state.')
}

messageHandlers[YMessageType.Awareness] = (
    _encoder,
    decoder,
    provider,
    _emitSynced,
    _messageType
) => {
    // console.log('Handling messageAwareness')
    const awarenessUpdate = decoding.readVarUint8Array(decoder)
    awarenessProtocol.applyAwarenessUpdate(
        provider.awareness,
        awarenessUpdate,
        provider
    )
}

messageHandlers[YMessageType.Auth] = (
    _encoder,
    decoder,
    provider,
    _emitSynced,
    _messageType
) => {
    console.log('Handling messageAuth')
    authProtocol.readAuthMessage(
        decoder,
        provider.doc,
        (_ydoc, reason) => permissionDeniedHandler(provider, reason)
    )
}
const permissionDeniedHandler = (provider: YWsProvider, reason: string) =>
    console.warn(`Permission denied to access ${provider.url}.\n${reason}`)
