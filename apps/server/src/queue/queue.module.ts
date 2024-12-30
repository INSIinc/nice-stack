import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { PushService } from './push/push.service';
import { PushQueueService } from './push/push.queue.service';

@Module({
  imports: [
    ConfigModule.forRoot(), // 导入 ConfigModule
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          password: configService.get<string>('REDIS_PASSWORD'),
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'general',
      processors: [join(__dirname, 'worker/processor.js')],
    })
  ],
  providers: [Logger, PushService, PushQueueService],
  exports: [PushService, PushQueueService]

})
export class QueueModule { }
