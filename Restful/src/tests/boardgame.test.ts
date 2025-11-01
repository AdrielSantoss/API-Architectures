import { describe, expect, it } from 'vitest';
import { app } from '../../vitest.setup.js';
import { BoardgameDto, BoardgamesDto } from '../models/boardgameDto.js';
import { DuplicateBoardgameError } from '../errors/duplicateBoardgameError.js';
import { BoardgameNotFoundError } from '../errors/boardgameNotFoundError.js';

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

describe('GET /boardgame/:id', () => {
    it.each([
        'should return 200 and "Terraforming Mars"',
        'should return 200 and cached boardgame "Terraforming Mars"',
    ])('%s', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/boardgames/10`,
        });

        const data = JSON.parse(response.body) as BoardgameDto;

        expect(response.statusCode).toBe(200);
        expect(data.nome).toBe('Terraforming Mars');
    });
});

describe('POST /boardgames/2', () => {
    const newBoardgame = <BoardgameDto>{
        nome: 'Slay the Spire',
        descricao:
            'Craft a unique deck, discover powerful relics, and Slay the Spire together!',
        complexidade: 2,
        tempo: 150,
    };

    it('should return 201 and create new boardgame.', async () => {
        const response = await app.inject({
            method: 'POST',
            url: `/boardgames/2`,
            body: newBoardgame,
            headers: {
                idempotencykey: 'abcf-1236',
            },
        });

        const data = JSON.parse(response.body) as BoardgameDto;

        expect(response.statusCode).toBe(201);
        expect(data.nome).toBe(newBoardgame.nome);
        expect(data.descricao).toBe(newBoardgame.descricao);
        expect(data.complexidade).toBe(newBoardgame.complexidade);
        expect(data.tempo).toBe(newBoardgame.tempo);
        expect(data.created).toBe(true);
    });

    it('should return boardgame with the same idempotencykey.', async () => {
        const response = await app.inject({
            method: 'POST',
            url: `/boardgames/2`,
            body: newBoardgame,
            headers: {
                idempotencykey: 'abcf-1236',
            },
        });

        const data = JSON.parse(response.body) as BoardgameDto;

        expect(response.statusCode).toBe(200);
        expect(data.nome).toBe(newBoardgame.nome);
        expect(data.descricao).toBe(newBoardgame.descricao);
        expect(data.complexidade).toBe(newBoardgame.complexidade);
        expect(data.tempo).toBe(newBoardgame.tempo);
        expect(data.created).toBe(undefined);
    });

    it('should return duplicate boardgame error.', async () => {
        const response = await app.inject({
            method: 'POST',
            url: `/boardgames/2`,
            body: newBoardgame,
            headers: {
                idempotencykey: 'abcd-1234',
            },
        });

        const data = JSON.parse(response.body);
        const conflictError = new DuplicateBoardgameError();

        expect(response.statusCode).toBe(conflictError.statusCode);
        expect(data.message).toBe(conflictError.message);
    });
});

describe('PUT /boardgames/:id', () => {
    const newBoardgame = <BoardgameDto>{
        nome: 'Verdant',
        descricao:
            'Collect and care for houseplants as you arrange the coziest home.',
        complexidade: 2,
        tempo: 60,
        idade: 10,
    };

    it('should return 200 and update boardgame.', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/boardgames/1',
            body: newBoardgame,
        });

        const data = JSON.parse(response.body) as BoardgameDto;

        expect(response.statusCode).toBe(200);
        expect(data.nome).toBe(newBoardgame.nome);
        expect(data.descricao).toBe(newBoardgame.descricao);
        expect(data.complexidade).toBe(newBoardgame.complexidade);
        expect(data.tempo).toBe(newBoardgame.tempo);
    });

    it('should return boardgame not found error.', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/boardgames/999',
            body: newBoardgame,
        });

        const data = JSON.parse(response.body);
        const boardgameNotFoundError = new BoardgameNotFoundError();

        expect(response.statusCode).toBe(boardgameNotFoundError.statusCode);
        expect(data.message).toBe(boardgameNotFoundError.message);
    });
});

describe('DELETE /boardgames/:id', () => {
    it('should return 200 and delete boardgame.', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/boardgames/3',
        });

        expect(response.statusCode).toBe(204);
    });

    it('should return boardgame not found error.', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/boardgames/999',
        });

        const data = JSON.parse(response.body);
        const boardgameNotFoundError = new BoardgameNotFoundError();

        expect(response.statusCode).toBe(404);
        expect(data.message).toBe(boardgameNotFoundError.message);
    });
});
