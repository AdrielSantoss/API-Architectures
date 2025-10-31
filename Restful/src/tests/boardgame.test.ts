import { describe, expect, it } from 'vitest';
import { app } from '../../vitest.setup.js';
import { BoardgamesDto } from '../models/boardgameDto.js';

describe('GET /boardgames', () => {
    it.each([
        { name: 'should return 200 and "Pandemic" boardgame (first request)' },
        { name: 'should return 200 and cached boardgame (second request)' },
    ])('$name', async () => {
        const limit = 5;
        const page = 1;

        const response = await app.inject({
            method: 'GET',
            url: `/boardgames?page=${page}&limit=${limit}`,
        });

        const data = JSON.parse(response.body) as BoardgamesDto;

        expect(response.statusCode).toBe(200);
        expect(data.data![0].nome).toBe('Catan');
        expect(data.data!.length).toBe(limit);
        expect(data.meta.limit).toBe(limit);
        expect(data.meta.page).toBe(page);
        expect(data.meta.hasNextPage).toBe(true);
    });
});
