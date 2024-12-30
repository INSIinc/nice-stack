import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { db, getUniqueItems, MessageDto, ObjectType } from "@nicestack/common"
import { MessageContent } from "./push.service";
import EventBus, { CrudOperation } from "@server/utils/event-bus";
export interface PushMessageJobData {
    id: string
    registerToken: string
    messageContent: MessageContent
}
@Injectable()
export class PushQueueService implements OnModuleInit {
    private readonly logger = new Logger(PushQueueService.name)
    constructor(@InjectQueue('general') private generalQueue: Queue) { }
    onModuleInit() {
        EventBus.on("dataChanged", async ({ data, type, operation }) => {
            if (type === ObjectType.MESSAGE && operation === CrudOperation.CREATED) {
                const message = data as Partial<MessageDto>
                const uniqueStaffs = getUniqueItems(message.receivers, "id")
                uniqueStaffs.forEach(item => {
                    const token = item.registerToken
                    if (token) {
                        this.addPushMessageJob({
                            registerToken: token,
                            messageContent: {
                                data: {
                                    title: message.title,
                                    content: message.content,
                                    click_action: {
                                        intent: message.intent,
                                        url: message.url
                                    }
                                },
                                option: message.option as any
                            },
                            id: message.id
                        })
                    } else {
                        this.logger.warn(`用户 ${item.username} 尚未注册registerToken取消消息推送`)
                    }

                })
            }
        })
    }
    async addPushMessageJob(data: PushMessageJobData) {
        this.logger.log("add push message task", data.registerToken)
        await this.generalQueue.add('pushMessage', data, { debounce: { id: data.id } })
    }

}