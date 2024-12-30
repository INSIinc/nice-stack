import * as dotenv from 'dotenv';
dotenv.config();
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
const logger = new Logger('RedisClient');
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD;
logger.log(`Initializing Redis with host ${redisHost} port ${redisPort}`);
let redisClientInstance: Redis | null = null;
export const getRedisClient = (): Redis => {
  if (!redisClientInstance) {
    redisClientInstance = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,

      retryStrategy: (times) => {
        logger.debug(`Reconnecting to Redis, attempt #${times}`);
        return Math.min(times * 50, 2000); // Exponential backoff strategy
      },
    });

    redisClientInstance.on('connect', async () => {
      logger.log('Redis client connected');
      try {
        const info = await redisClientInstance.info('memory');
        const memoryUsedMatch = info.match(/used_memory:(\d+)/);
        if (memoryUsedMatch) {
          const memoryUsedMB = (
            Number(memoryUsedMatch[1]) /
            (1024 * 1024)
          ).toFixed(2);
          logger.log(`Memory used by Redis: ${memoryUsedMB} MB`);
        } else {
          throw new Error('Could not retrieve memory usage information.');
        }
      } catch (error) {
        logger.error('Error fetching memory usage:', error);
      }
    });

    redisClientInstance.on('error', (err) => {
      logger.error('Redis client error', err);
    });

    redisClientInstance.on('reconnecting', () => {
      logger.log(
        `Reconnecting to Redis at host ${redisHost} port ${redisPort}`,
      );
    });
  }

  return redisClientInstance;
};

// Usage
export const redis = getRedisClient();

// export class RedisService {
//   private static instance: RedisService;
//   private redisClient: Redis;
//   private logger = new Logger(RedisService.name);

//   private constructor() {
//     try {

//       const redisHost = process.env.REDIS_HOST || 'localhost';
//       const redisPort = parseInt(process.env.REDIS_PORT || '6379');
//       const redisPassword = process.env.REDIS_PASSWORD
//       this.logger.log(`Initializing Redis with host ${redisHost} port ${redisPort}`);

//       this.redisClient = new Redis({
//         host: redisHost,
//         port: redisPort,
//         password: redisPassword,

//         retryStrategy: (times) => {
//           this.logger.debug(`Reconnecting to Redis, attempt #${times}`);
//           return Math.min(times * 50, 2000);  // Exponential backoff strategy
//         },
//       });

//       this.redisClient.on('connect', async () => {
//         this.logger.log('Redis client connected');
//         try {
//           const info = await this.redisClient.info('memory');
//           const memoryUsedMatch = info.match(/used_memory:(\d+)/);
//           if (memoryUsedMatch) {
//             const memoryUsedMB = (Number(memoryUsedMatch[1]) / (1024 * 1024)).toFixed(2);
//             this.logger.log(`Memory used by Redis: ${memoryUsedMB} MB`);
//           } else {
//             throw new Error('Could not retrieve memory usage information.');
//           }
//         } catch (error) {
//           this.logger.error('Error fetching memory usage:', error);
//         }
//       });

//       this.redisClient.on('error', (err) => {
//         this.logger.error('Redis client error', err);
//       });

//       this.redisClient.on('reconnecting', () => {
//         this.logger.log(`Reconnecting to Redis at host ${redisHost} port ${redisPort}`);
//       });
//     } catch (error) {
//       this.logger.error('Error during Redis client initialization', error);
//     }
//   }

//   public static getInstance(): RedisService {
//     if (!RedisService.instance) {

//       RedisService.instance = new RedisService();
//     }
//     return RedisService.instance;
//   }

//   setValue(key: string, value: string) {
//     return this.redisClient.set(key, value);
//   }

//   getValue(key: string) {
//     return this.redisClient.get(key);
//   }

//   keys(pattern: string) {
//     return this.redisClient.keys(pattern);
//   }

//   setWithExpiry(key: string, value: string, time: number) {
//     return this.redisClient.setex(key, time, value);
//   }

//   deleteKey(key: string) {
//     // this.logger.log(`Deleted Key ${key}`);
//     return this.redisClient.del(key);
//   }

//   setHashField(key: string, field: string, value: string) {
//     return this.redisClient.hset(key, field, value);
//   }

//   getHashField(key: string, field: string) {
//     return this.redisClient.hget(key, field);
//   }

//   getAllHashFields(key: string) {
//     return this.redisClient.hgetall(key);
//   }

//   publishMessage(channel: string, message: string) {
//     return this.redisClient.publish(channel, message);
//   }

//   subscribeToMessages(channel: string, messageHandler: (channel: string, message: string) => void) {
//     this.redisClient.subscribe(channel, (err, count) => {
//       if (err) {
//         this.logger.error('Subscription error', err);
//       } else {
//         this.logger.log(`Subscribed to ${count} channels`);
//       }
//     });

//     this.redisClient.on('message', (channel, message) => {
//       this.logger.log(`Received message ${message} from channel ${channel}`);
//       messageHandler(channel, message);
//     });
//   }

//   unsubscribeFromChannel(channel: string) {
//     return this.redisClient.unsubscribe(channel);
//   }

//   unsubscribeAll() {
//     return this.redisClient.quit();
//   }

//   async deleteByPattern(pattern: string): Promise<void> {
//     try {
//       const keys = await this.redisClient.keys(pattern);
//       if (keys.length > 0) {
//         await this.redisClient.del(keys);
//         // this.logger.log(`Deleted ${keys.length} keys matching pattern ${pattern}`);
//       }
//     } catch (error) {
//       this.logger.error(`Failed to delete keys by pattern ${pattern}:`, error);
//     }
//   }

// }
