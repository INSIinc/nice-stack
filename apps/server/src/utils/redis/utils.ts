import { redis } from "./redis.service";

export async function deleteByPattern(pattern: string) {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(keys);
            // this.logger.log(`Deleted ${keys.length} keys matching pattern ${pattern}`);
        }
    } catch (error) {
        console.error(`Failed to delete keys by pattern ${pattern}:`, error);
    }
}