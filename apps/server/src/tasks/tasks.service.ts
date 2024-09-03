import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InitService } from '@server/init/init.service';
import { CronJob } from 'cron';

@Injectable()
export class TasksService implements OnModuleInit {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly initService: InitService,
    ) { }

    async onModuleInit() {
        this.logger.log('Main node launch');
        await this.initService.init();

        const handleCronJob = new CronJob('0 * * * *', () => {
            this.logger.log('cron job test');
        });

        this.schedulerRegistry.addCronJob('cronJob', handleCronJob);
        this.logger.log('Start cron job');
        handleCronJob.start();
    }
}
