import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CustomJobType } from '../job.interface';
import { PushService } from '@server/queue/push/push.service';

const logger = new Logger("QueueWorker");

const pushService = new PushService()
export default async function (job: Job<any, any, CustomJobType>) {

    switch (job.name) {
        case "pushMessage":

            logger.log(`push message ${job.data.id}`)
            pushService.messagePush(job.data.registerToken, job.data.messageContent)
            break
    }
}