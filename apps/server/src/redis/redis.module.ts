// redis.module.ts
import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [RedisService, ConfigService], // 注册 RedisService 作为提供者
  exports: [RedisService], // 导出 RedisService

})
export class RedisModule { }
