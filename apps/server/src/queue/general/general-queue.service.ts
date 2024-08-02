import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { SocketGateway } from '@server/socket/socket.gateway';
@Injectable()
export class GeneralQueueService implements OnModuleInit {
    private readonly logger = new Logger(GeneralQueueService.name,)
    constructor(@InjectQueue('general') private generalQueue: Queue, private socketGateway: SocketGateway) { }
    onModuleInit() {
        this.logger.log(`general queue service init at pid=${process.pid}`)

    }
    async addJob(data: any) {
        this.logger.log('add embedding job', data.title)

        await this.generalQueue.add('embedding', data, { debounce: { id: data.id } });

    }
    async getWaitingJobs() {
        const waitingJobs = await this.generalQueue.getJobs(["waiting"])
        return waitingJobs
    }
}
