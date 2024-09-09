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

@Module({
  imports: [ScheduleModule.forRoot(), TrpcModule, RedisModule, QueueModule, TransformModule, AuthModule],
  providers: [RedisService, SocketGateway, ConfigService],
})
export class AppModule { }
