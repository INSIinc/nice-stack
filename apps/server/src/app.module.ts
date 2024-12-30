import { Module } from '@nestjs/common';
import { TrpcModule } from './trpc/trpc.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './auth/auth.module';
import { TaxonomyModule } from './models/taxonomy/taxonomy.module';
import { TasksModule } from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { InitModule } from './tasks/init/init.module';
import { ReminderModule } from './tasks/reminder/reminder.module';
import { JwtModule } from '@nestjs/jwt';
import { env } from './env';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { MinioModule } from './utils/minio/minio.module';
import { WebSocketModule } from './socket/websocket.module';
import { CollaborationModule } from './socket/collaboration/collaboration.module';
import { ExceptionsFilter } from './filters/exceptions.filter';
import { TransformModule } from './models/transform/transform.module';
import { RealTimeModule } from './socket/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用
      envFilePath: '.env'
    }),
    ScheduleModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: env.JWT_SECRET
    }),
    WebSocketModule,
    TrpcModule,
    QueueModule,
    AuthModule,
    TaxonomyModule,
    TasksModule,
    InitModule,
    ReminderModule,
    TransformModule,
    MinioModule,
    CollaborationModule,
    RealTimeModule
  ],
  providers: [{
    provide: APP_FILTER,
    useClass: ExceptionsFilter,
  }],
})
export class AppModule { }
