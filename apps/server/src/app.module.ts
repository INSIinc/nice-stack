import { Module } from '@nestjs/common';
import { TrpcModule } from './trpc/trpc.module';
import { RedisService } from './redis/redis.service';

import { RedisModule } from './redis/redis.module';
import { SocketGateway } from './socket/socket.gateway';
import { QueueModule } from './queue/queue.module';
import { TransformModule } from './transform/transform.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { TasksModule } from './tasks/tasks.module';
import { JwtModule } from '@nestjs/jwt';
import { env } from './env';

@Module({
  imports: [ScheduleModule.forRoot(), JwtModule.register({
    global: true,
    secret: env.JWT_SECRET
  }), TrpcModule, RedisModule, QueueModule, TransformModule, AuthModule, TasksModule],
  providers: [RedisService, SocketGateway, ConfigService],
})
export class AppModule { }
