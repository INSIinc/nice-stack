import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InitService } from '@server/tasks/init/init.service';
import { ReminderService } from '@server/tasks/reminder/reminder.service';
import { CronJob } from 'cron';

@Injectable()
export class TasksService implements OnModuleInit {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly initService: InitService,
        private readonly reminderService: ReminderService
    ) { }

    async onModuleInit() {
        this.logger.log('Main node launch');
        try {
            await this.initService.init();
            this.logger.log('Initialization successful');
        } catch (err) {
            this.logger.error('Database not deployed or initialization error', err);
            // Optionally rethrow the error if you want to halt further execution
            // throw err;
        }

        try {
            const cronExpression = process.env.DEADLINE_CRON;
            if (!cronExpression) {
                throw new Error('DEADLINE_CRON environment variable is not set');
            }

            const handleRemindJob = new CronJob(cronExpression, async () => {
                try {
                    await this.reminderService.remindDeadline();
                    this.logger.log('Reminder successfully processed');
                } catch (reminderErr) {
                    this.logger.error('Error occurred while processing reminder', reminderErr);
                }
            });

            this.schedulerRegistry.addCronJob('remindDeadline', handleRemindJob as any);
            this.logger.log('Start remind cron job');
            handleRemindJob.start();
        } catch (cronJobErr) {
            this.logger.error('Failed to initialize cron job', cronJobErr);
            // Optionally rethrow the error if you want to halt further execution
            // throw cronJobErr;
        }
    }
}
