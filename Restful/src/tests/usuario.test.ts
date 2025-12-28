import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UsuarioDto, UsuariosDto } from '../api/models/usuarioDto.js';
import { UserNotFoundError } from '../core/errors/userNotFoundError.js';
import { DuplicateUserError } from '../core/errors/duplicateUserError.js';
import { InjectOptions } from 'fastify';
import { redis } from '../database/redisConnections.js';
import { buildServer } from '../index.js';

let app: ReturnType<typeof buildServer>;
let access_token: string | null = null;

beforeAll(async () => {
    app = buildServer();

    await app.ready();
});

afterAll(async () => {
    await redis.FLUSHDB();

    await redis.quit();
    await app.close();
});

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
        expect(response.body).toBeDefined();

        app.jwt.verify(response.body);

        access_token = `Bearer ${response.body}`;
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

describe('GET /usuarios', () => {
    it.each([
        { name: 'should return 200 and "Alice" user (first request)' },
        { name: 'should return 200 and cached user (second request)' },
    ])('$name', async () => {
        const limit = 10;
        const page = 1;

        const response = await app.inject({
            method: 'GET',
            url: `/usuarios?page=${page}&limit=${limit}`,
        });

        const data = JSON.parse(response.body) as UsuariosDto;

        expect(response.statusCode).toBe(200);
        expect(data.data![0].nome).toBe('Alice');
        expect(data.data!.length).toBe(limit);
        expect(data.meta.limit).toBe(limit);
        expect(data.meta.page).toBe(page);
        expect(data.meta.hasNextPage).toBe(true);
    });
});

describe('GET /usuarios/:id', () => {
    it.each([
        'should return 200 and "alice@prisma.io"',
        'should return 200 and cached user "alice@prisma.io"',
    ])('%s', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/usuarios/1`,
        });

        const data = JSON.parse(response.body) as UsuarioDto;

        expect(response.statusCode).toBe(200);
        expect(data.email).toBe('alice@prisma.io');
    });
});

describe('POST /usuarios', () => {
    const newUsario = <UsuarioDto>{
        email: `newuser${Date.now()}@gmail.com`,
        nome: 'foobar',
    };

    it('should return 201 and create new user.', async () => {
        const response = await app.inject({
            method: 'POST',
            url: `/usuarios`,
            body: newUsario,
            headers: {
                idempotencykey: 'abc-123',
            },
        });

        const data = JSON.parse(response.body) as UsuarioDto;

        expect(response.statusCode).toBe(201);
        expect(data.email).toBe(newUsario.email);
        expect(data.nome).toBe(newUsario.nome);
        expect(data.created).toBe(true);
    });

    it('should return user with the same idempotencykey.', async () => {
        const response = await app.inject({
            method: 'POST',
            url: `/usuarios`,
            body: newUsario,
            headers: {
                idempotencykey: 'abc-123',
            },
        });

        const data = JSON.parse(response.body) as UsuarioDto;

        expect(response.statusCode).toBe(200);
        expect(data.email).toBe(newUsario.email);
        expect(data.nome).toBe(newUsario.nome);
        expect(data.created).toBe(undefined);
    });

    it('should return duplicate user error.', async () => {
        const response = await app.inject({
            method: 'POST',
            url: `/usuarios`,
            body: newUsario,
            headers: {
                idempotencykey: 'abcd-1234',
            },
        });

        const data = JSON.parse(response.body);
        const conflictError = new DuplicateUserError();

        expect(response.statusCode).toBe(conflictError.statusCode);
        expect(data.message).toBe(conflictError.message);
    });
});

describe('PUT /usuarios/:id', () => {
    const newUsario = <UsuarioDto>{
        email: `updateuser${Date.now()}@gmail.com`,
        nome: 'foobar',
    };

    it('should return 200 and update user.', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/usuarios/2',
            body: newUsario,
        });

        const data = JSON.parse(response.body) as UsuarioDto;

        expect(response.statusCode).toBe(200);
        expect(data.email).toBe(newUsario.email);
        expect(data.nome).toBe(newUsario.nome);
    });

    it('should return user not found error.', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/usuarios/999',
            body: newUsario,
        });

        const data = JSON.parse(response.body);
        const userNotFoundEror = new UserNotFoundError();

        expect(response.statusCode).toBe(userNotFoundEror.statusCode);
        expect(data.message).toBe(userNotFoundEror.message);
    });
});

describe('DELETE /usuarios/:id', () => {
    it('should return 200 and delete user.', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/usuarios/3',
        });

        expect(response.statusCode).toBe(204);
    });

    it('should return user not found error.', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/usuarios/999',
        });

        const data = JSON.parse(response.body);
        const userNotFoundEror = new UserNotFoundError();

        expect(response.statusCode).toBe(userNotFoundEror.statusCode);
        expect(data.message).toBe(userNotFoundEror.message);
    });
});
