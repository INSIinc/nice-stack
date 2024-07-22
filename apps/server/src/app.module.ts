import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcModule } from './trpc/trpc.module';
import { RedisService } from './redis/redis.service';

import { RedisModule } from './redis/redis.module';

@Module({
  imports: [TrpcModule, RedisModule],
  controllers: [AppController],
  providers: [AppService, RedisService],
})
export class AppModule { }
