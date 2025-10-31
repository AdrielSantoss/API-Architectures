// vitest.setup.ts
import { beforeAll, afterAll } from 'vitest';
import { buildServer } from './src/index.js';

export let app: ReturnType<typeof buildServer>;

beforeAll(async () => {
    app = buildServer();
    await app.ready();
});

afterAll(async () => {
    await app.close();
});
