import { RedisOptions } from 'bullmq';
import { createClient } from 'redis';

export const redisConfig = {
    host: '127.0.0.1',
    port: 6379,
};

export const bullRedisOptions: RedisOptions = {
    host: redisConfig.host,
    port: redisConfig.port,
};

export const redis = await createClient({
    socket: {
        host: redisConfig.host,
        port: redisConfig.port,
    },
}).connect();

redis.on('error', (err) => {
    console.error('Redis connection error', err);
});
