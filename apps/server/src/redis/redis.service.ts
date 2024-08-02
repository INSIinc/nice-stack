import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'), // Redis 服务器的端口
    });
  }

  setValue(key: string, value: string) {
    return this.redisClient.set(key, value);
  }
  getValue(key: string) {
    return this.redisClient.get(key);

  }
  keys(pattern: string) {
    return this.redisClient.keys(pattern)
  }
  setWithExpiry(key: string, value: string, time: number) {
    return this.redisClient.setex(key, time, value);
  }
  deleteKey(key: string) {
    return this.redisClient.del(key);
  }
  setHashField(key: string, field: string, value: string) {
    return this.redisClient.hset(key, field, value);
  }
  //获取key中的field字段数据
  getHashField(key: string, field: string) {
    return this.redisClient.hget(key, field);
  }
  //获取key中所有数据
  getAllHashFields(key: string) {
    return this.redisClient.hgetall(key);
  }
  publishMessage(channel: string, message: string) {
    return this.redisClient.publish(channel, message);
  }

  // 订阅消息，需要提供一个回调函数来处理接收到的消息
  subscribeToMessages(channel: string, messageHandler: (channel: string, message: string) => void) {
    this.redisClient.subscribe(channel, (err, count) => {
      if (err) {
        console.error('Subscription error', err);
      } else {
        console.log(`Subscribed to ${count} channels`);
      }
    });

    this.redisClient.on('message', (channel, message) => {
      console.log(`Received message ${message} from channel ${channel}`);
      messageHandler(channel, message);
    });
  }

  // 取消订阅指定的频道
  unsubscribeFromChannel(channel: string) {
    return this.redisClient.unsubscribe(channel);
  }

  // 取消订阅所有频道
  unsubscribeAll() {
    return this.redisClient.quit();
  }
}

