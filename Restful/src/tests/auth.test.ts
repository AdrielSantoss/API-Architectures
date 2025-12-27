import { InjectOptions } from 'fastify';
import { app } from '../../vitest.setup';
import { describe, expect, it } from 'vitest';

describe('GET /auth/token', () => {
    let requestInfos: InjectOptions = {
        method: 'POST',
        url: `/auth/token`,
        headers: {
            'x-api-key': 'ceb61bab-e096-4835-8629-fd1b93b37179',
        },
    };

    it('should return 200', async () => {
        const response = await app.inject(requestInfos);

        expect(response.statusCode).toBe(200);
    });

    it('should return 400', async () => {
        requestInfos.headers = undefined;

        const response = await app.inject(requestInfos);

        expect(response.statusCode).toBe(400);
    });

    it('should return 401', async () => {
        requestInfos.headers = { 'x-api-key': 'abc123' };

        const response = await app.inject(requestInfos);

        expect(response.statusCode).toBe(401);
    });
});
