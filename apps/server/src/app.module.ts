import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcModule } from './trpc/trpc.module';
import { RedisService } from './redis/redis.service';

import { RedisModule } from './redis/redis.module';
import { SocketGateway } from './socket/socket.gateway';
import { QueueModule } from './queue/queue.module';
import { TransformModule } from './transform/transform.module';
import { ControllerService } from './controller/controller.service';

@Module({
  imports: [TrpcModule, RedisModule, QueueModule, TransformModule],
  controllers: [AppController],
  providers: [AppService, RedisService, SocketGateway, ControllerService],
})
export class AppModule { }
