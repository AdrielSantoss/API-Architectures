import fastify, { InjectOptions } from 'fastify';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from '..';

beforeAll(async () => {
    await app.ready();
});

describe('GET /', () => {
    let requestInfos: InjectOptions = {
        method: 'GET',
        url: `/`,
    };

    it('should return 200', async () => {
        const response = await app.inject(requestInfos);

        const body = JSON.parse(response.body);
        expect(response.statusCode).toBe(200);
        expect(body?.data?.add).toBe(4);
    });
});
