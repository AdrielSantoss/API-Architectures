import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UsuarioDto, UsuariosDto } from '../api/models/usuarioDto.js';
import { UserNotFoundError } from '../core/errors/userNotFoundError.js';
import { DuplicateUserError } from '../core/errors/duplicateUserError.js';
import { redis } from '../core/providers/redisProvider.js';
import { buildServer } from '../index.js';
import { mergeOIDCCookies } from '../core/utils/vitest.js';

let app: Awaited<ReturnType<typeof buildServer>>;
const port = process.env.PORT ?? '3000';
let accessTokenInfos: any;

beforeAll(async () => {
    app = await buildServer();

    await app.ready();
});

afterAll(async () => {
    await redis.FLUSHDB();

    await redis.quit();
    await app.close();
});

describe('REGISTER TEST USER', () => {
    const newUsario = <UsuarioDto>{
        email: `testuser@gmail.com`,
        nome: 'testUser',
        senha: 'abc123',
    };

    it('should return 201 and create new test user.', async () => {
        const response = await app.inject({
            method: 'POST',
            url: `/usuarios`,
            body: newUsario,
            headers: {
                idempotencykey: 'test-123',
            },
        });

        const data = JSON.parse(response.body) as UsuarioDto;

        expect(response.statusCode).toBe(201);
        expect(data.email).toBe(newUsario.email);
        expect(data.nome).toBe(newUsario.nome);
        expect(data.created).toBe(true);
    });
});

describe('OPENID CONNECT', () => {
    let interactionRoute: string;
    let cookies: string[] = [];

    it('should redirect to login interaction', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/oidc/auth?response_type=code&client_id=app&redirect_uri=http://localhost:${port}/home&scope=openid%20email&resource=http://localhost:${port}&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256`,
        });

        expect(response.statusCode).toBe(303);
        cookies = mergeOIDCCookies(cookies, response.headers['set-cookie']);
        interactionRoute = response.headers.location!;
    });

    it('should load login page', async () => {
        const response = await app.inject({
            method: 'GET',
            url: interactionRoute,
            headers: { cookie: cookies.join('; ') },
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');

        cookies = mergeOIDCCookies(cookies, response.headers['set-cookie']);
    });

    it('should login failed', async () => {
        const response = await app.inject({
            method: 'POST',
            url: interactionRoute + '/login',
            headers: {
                cookie: cookies.join('; '),
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'testuser@gmail.com',
                password: 'abc1234',
            }).toString(),
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');
        expect(response.body).toContain('Email ou senha inválidos.');
    });

    it('should login successfully and redirect to consent', async () => {
        const response = await app.inject({
            method: 'POST',
            url: interactionRoute + '/login',
            headers: {
                cookie: cookies.join('; '),
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'testuser@gmail.com',
                password: 'abc123',
            }).toString(),
        });

        expect(response.statusCode).toBe(303);
        cookies = mergeOIDCCookies(cookies, response.headers['set-cookie']);

        const returnTo = response.headers.location!;

        interactionRoute = response.headers.location!;

        const followUp = await app.inject({
            method: 'GET',
            url: returnTo,
            headers: { cookie: cookies.join('; ') },
        });

        expect(followUp.statusCode).toBe(303);
        cookies = mergeOIDCCookies(cookies, followUp.headers['set-cookie']);

        interactionRoute = followUp.headers.location!;

        const consentPage = await app.inject({
            method: 'GET',
            url: interactionRoute,
            headers: { cookie: cookies.join('; ') },
        });

        expect(consentPage.statusCode).toBe(200);
        expect(consentPage.headers['content-type']).toContain('text/html');
        cookies = mergeOIDCCookies(cookies, consentPage.headers['set-cookie']);
    });

    it('should confirm consent and redirect to home with code PCKE', async () => {
        const confirmConsent = await app.inject({
            method: 'POST',
            url: interactionRoute + '/consent/confirm',
            headers: {
                cookie: cookies.join('; '),
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        expect(confirmConsent.statusCode).toBe(303);

        const redirectUri = confirmConsent.headers.location!;
        cookies = mergeOIDCCookies(
            cookies,
            confirmConsent.headers['set-cookie']
        );

        const getOidcAuth = await app.inject({
            method: 'GET',
            url: redirectUri,
            headers: { cookie: cookies.join('; ') },
        });

        interactionRoute = getOidcAuth.headers.location!;

        expect(getOidcAuth.statusCode).toBe(303);
        expect(interactionRoute).toContain(`http://localhost:${port}/home`);
        expect(interactionRoute).toContain('code=');
    });

    it('should exchange authorization code for tokens', async () => {
        const url = new URL(interactionRoute);
        const authorizationCode = url.searchParams.get('code');

        expect(authorizationCode).toBeTruthy();

        const tokenResponse = await app.inject({
            method: 'POST',
            url: '/oidc/token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: 'app',
                redirect_uri: `http://localhost:${port}/home`,
                code: authorizationCode!,
                code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
                resource: `http://localhost:${port}`,
            }).toString(),
        });

        expect(tokenResponse.statusCode).toBe(200);

        const body = JSON.parse(tokenResponse.body);

        expect(body).toHaveProperty('access_token');
        expect(body).toHaveProperty('id_token');
        expect(body.token_type).toBe('Bearer');
        expect(body.expires_in).toBeGreaterThan(0);

        accessTokenInfos = body;
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
            headers: {
                authorization: `${accessTokenInfos.token_type} ${accessTokenInfos.access_token}`,
            },
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
