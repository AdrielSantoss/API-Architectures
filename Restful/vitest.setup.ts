// vitest.setup.ts
import { beforeAll, afterAll } from 'vitest';
import { buildServer } from './src/index.js';
import { redis } from './src/database/redisConnections.js';

export let app: ReturnType<typeof buildServer>;

beforeAll(async () => {
    app = buildServer();
    await app.ready();
});

afterAll(async () => {
    await redis.FLUSHDB();

    await redis.quit();
    await app.close();
});
