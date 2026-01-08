import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UsuarioDto, UsuariosDto } from '../api/models/usuarioDto.js';
import { UserNotFoundError } from '../core/errors/userNotFoundError.js';
import { DuplicateUserError } from '../core/errors/duplicateUserError.js';
import { redis } from '../core/providers/redisProvider.js';
import { buildServer } from '../index.js';
import { InvalidUserCredentialsError } from '../core/errors/invalidUserCredentialsError.js';

let app: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
    app = await buildServer();

    await app.ready();
});

afterAll(async () => {
    await redis.FLUSHDB();

    await redis.quit();
    await app.close();
});

describe('OPENID CONNECT', () => {
    it('should return 200', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/oidc/.well-known/openid-configuration`,
        });

        expect(response.statusCode).toBe(200);
    });

    let interactionRoute: string;
    let cookikesAuthSession: string[];

    it('should redirect to interaction and load login page', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/oidc/auth?response_type=code&client_id=app&redirect_uri=http://localhost:3000/home&scope=openid%20email&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256`,
        });

        expect(response.statusCode).toBe(303);

        cookikesAuthSession = response.headers['set-cookie'] as string[];
        expect(cookikesAuthSession).toBeDefined();

        interactionRoute = response.headers.location!;

        const responseLoginPage = await app.inject({
            method: 'GET',
            url: interactionRoute,
            headers: {
                cookie: cookikesAuthSession.join(';'),
            },
        });

        expect(responseLoginPage.statusCode).toBe(200);
        expect(responseLoginPage.headers['content-type']).toContain(
            'text/html'
        );
    });

    it('should return 401 and login failed: user not found', async () => {
        const response = await app.inject({
            method: 'POST',
            url: interactionRoute + '/login',
            headers: {
                cookie: cookikesAuthSession.join(';'),
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'notfound@prisma.io.notfound',
                password: 'abc123',
            }).toString(),
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');

        expect(response.body).toContain(new UserNotFoundError().message);
    });

    it('should return 401 and login failed: invalid password', async () => {
        const response = await app.inject({
            method: 'POST',
            url: interactionRoute + '/login',
            headers: {
                cookie: cookikesAuthSession.join(';'),
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'alice@prisma.io',
                password: 'abc123',
            }).toString(),
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');

        expect(response.body).toContain(
            new InvalidUserCredentialsError().message
        );
    });

    it('should return 200 and redirect consent page', async () => {
        const response = await app.inject({
            method: 'POST',
            url: interactionRoute + '/login',
            headers: {
                cookie: cookikesAuthSession.join(';'),
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'alice@prisma.io',
                password:
                    '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',
            }).toString(),
        });

        expect(response.statusCode).toBe(303);
    });

    it('should redirect to redirect_uri with access_denied error', async () => {
        const response = await app.inject({
            method: 'POST',
            url: interactionRoute + '/consent/abort',
            headers: {
                cookie: cookikesAuthSession.join(';'),
            },
        });

        expect(response.statusCode).toBe(303);
        expect(response.headers.location).toBeDefined();
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
        expect(data.data![0].senha).toBe(undefined);
        expect(data.data!.length).toBe(limit);
        expect(data.meta.limit).toBe(limit);
        expect(data.meta.page).toBe(page);
        expect(data.meta.hasNextPage).toBe(true);
    });
});

describe('GET /usuarios/:email', () => {
    it.each([
        'should return 200 and "alice@prisma.io"',
        'should return 200 and cached user "alice@prisma.io"',
    ])('%s', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/usuarios/alice@prisma.io`,
        });

        const data = JSON.parse(response.body) as UsuarioDto;

        expect(response.statusCode).toBe(200);
        expect(data.email).toBe('alice@prisma.io');
        expect(data.senha).toBe(undefined);
    });
});

describe('POST /usuarios', () => {
    const newUsario = <UsuarioDto>{
        email: `newuser${Date.now()}@gmail.com`,
        nome: 'foobar',
        senha: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',
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
