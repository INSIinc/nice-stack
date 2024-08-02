import {
    QueueEventsListener,
    QueueEventsHost,
    OnQueueEvent,
    InjectQueue,
} from '@nestjs/bullmq';
import { SocketGateway } from '@server/socket/socket.gateway';
import { Queue } from 'bullmq';


@QueueEventsListener('general')
export class GeneralQueueEvents extends QueueEventsHost {
    constructor(@InjectQueue('general') private generalQueue: Queue, private socketGateway: SocketGateway) {
        super()
    }

    @OnQueueEvent('completed')
    async onCompleted({
        jobId,
        returnvalue
    }: {
        jobId: string;
        returnvalue: string;
        prev?: string;
    }) {
      
    }
    @OnQueueEvent("progress")
    async onProgress({ jobId, data }: { jobId: string, data: any }) {

    }
}