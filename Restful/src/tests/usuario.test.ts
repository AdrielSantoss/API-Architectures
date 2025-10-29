import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UsuarioDto, UsuariosDto } from '../models/usuarioDto.js';
import { buildServer } from '../index.js';
import { UserNotFoundError } from '../errors/userNotFoundError.js';
import { DuplicateUserError } from '../errors/duplicateUserError.js';

let app: ReturnType<typeof buildServer>;

beforeAll(async () => {
    app = buildServer();
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

describe('GET /usuarios', () => {
    it('should return 200 and "Alice" user.', async () => {
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
    it('should return 200 and "alice@prisma.io".', async () => {
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
        // console.log(response.body)
        const userNotFoundEror = new UserNotFoundError();

        expect(response.statusCode).toBe(404);
        expect(data.message).toBe(userNotFoundEror.message);
    });
});
