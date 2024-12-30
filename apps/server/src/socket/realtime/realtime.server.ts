import { Injectable, OnModuleInit } from "@nestjs/common";
import { WebSocketType } from "../types";
import { BaseWebSocketServer } from "../base/base-websocket-server";
import EventBus, { CrudOperation } from "@server/utils/event-bus";
import { ObjectType, SocketMsgType, TroubleDto, MessageDto, PostDto, PostType } from "@nicestack/common";
@Injectable()
export class RealtimeServer extends BaseWebSocketServer implements OnModuleInit {
    onModuleInit() {
        EventBus.on("dataChanged", ({ data, type, operation }) => {
            if (type === ObjectType.MESSAGE && operation === CrudOperation.CREATED) {
                const receiverIds = (data as Partial<MessageDto>).receivers.map(receiver => receiver.id)
                this.sendToUsers(receiverIds, { type: SocketMsgType.NOTIFY, payload: { objectType: ObjectType.MESSAGE } })
            }
            if (type === ObjectType.TROUBLE) {
                const trouble = data as Partial<TroubleDto>
                this.sendToRoom('troubles', { type: SocketMsgType.NOTIFY, payload: { objectType: ObjectType.TROUBLE } })
                this.sendToRoom(trouble.id, { type: SocketMsgType.NOTIFY, payload: { objectType: ObjectType.TROUBLE } })
            }
            if (type === ObjectType.POST) {
                const post = data as Partial<PostDto>
                if (post.type === PostType.TROUBLE_INSTRUCTION || post.type === PostType.TROUBLE_PROGRESS) {
                    this.sendToRoom(post.referenceId, { type: SocketMsgType.NOTIFY, payload: { objectType: ObjectType.POST } })
                }
            }
        })

    }
    public get serverType(): WebSocketType {
        return WebSocketType.REALTIME;
    }
}
