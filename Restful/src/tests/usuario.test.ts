import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Usuario } from '@prisma/client';
import { NewUsuarioDto, UsuariosDto } from '../models/usuarioDto.js';
import { buildServer } from '../index.js';

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

        const data = JSON.parse(response.body) as Usuario;

        expect(response.statusCode).toBe(200);
        expect(data.email).toBe('alice@prisma.io');
    });
});

describe('POST /usuarios', () => {
    it('should return 200 and create new user.', async () => {
        const newUsario = <NewUsuarioDto>{
            email: 'newuser362122@gmail.com',
            name: 'foobar',
        };

        const response = await app.inject({
            method: 'POST',
            url: `/usuarios`,
            body: newUsario,
        });

        expect(response.statusCode).toBe(201);
    });
});
