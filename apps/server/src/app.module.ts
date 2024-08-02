import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcModule } from './trpc/trpc.module';
import { RedisService } from './redis/redis.service';

import { RedisModule } from './redis/redis.module';
import { SocketGateway } from './socket/socket.gateway';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [TrpcModule, RedisModule, QueueModule],
  controllers: [AppController],
  providers: [AppService, RedisService, SocketGateway],
})
export class AppModule { }
