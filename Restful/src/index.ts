import Fastify from 'fastify';
import { setUsariosRoutes } from './api/routes/usuarioRoutes.js';
import { UsuarioController } from './api/controllers/usuarioController.js';
import { BoardgameController } from './api/controllers/boardgameController.js';
import { setBoardgameRoutes } from './api/routes/boardgameRoutes.js';

import { redis } from './database/redisConnections.js';
import { prisma } from './database/prismaClient.js';
import { setAuthRoute } from './api/routes/authRoute.js';
import { AuthController } from './api/controllers/authController.js';
import jwt from '@fastify/jwt';
import * as oidc from 'oidc-provider';
import { config } from 'process';
import formbody from '@fastify/formbody';
import middie from '@fastify/middie';

export const authorizationServer = new oidc.Provider('http://localhost:3000', {
    clients: [
        {
            client_id: 'foo',
            client_secret: 'bar',
            redirect_uris: ['http://localhost:3000/home'],
            response_types: ['code'],
            grant_types: ['authorization_code'],
            token_endpoint_auth_method: 'none',
        },
    ],
    pkce: {
        required: () => false,
    },
    findAccount: async (ctx, id) => {
        return {
            accountId: id,
            async claims() {
                return {
                    sub: id,
                    email: id,
                };
            },
        };
    },

    interactions: {
        url(ctx, interaction) {
            return `/interaction/${interaction.uid}`;
        },
    },
    features: {
        devInteractions: { enabled: false },
    },
});

export const buildServer = async (logger = false) => {
    let app = Fastify({ logger });

    await app.register(jwt, {
        secret: process.env.JWT_SECRET!,
        sign: {
            expiresIn: '15m',
        },
    });

    await app.register(formbody);

    await app.register(middie).after(() => {
        app.use('/oidc', authorizationServer.callback());
    });

    app.get('/interaction/:uid', async (req, reply) => {
        const { uid } = req.params as { uid: number };
        reply.type('text/html').send(`
            <form method="post" action="/interaction/${uid}/login">
            <input name="email" />
            <input name="password" type="password" />
            <button>Login</button>
            </form>
        `);
    });

    app.post('/interaction/:uid/login', async (req, reply) => {
        const { uid } = req.params as { uid: number };

        // validar usuário
        const email = 'alice@prisma.io';

        await authorizationServer.interactionFinished(
            req.raw,
            reply.raw,
            {
                login: { accountId: uid.toString() },
            },
            { mergeWithLastSubmission: true }
        );
    });

    app.get('/home', async (req, reply) => {
        const { code, state } = req.query as {
            code?: string;
            state?: string;
        };

        reply.send({
            message: 'Authorization Code recebido',
            code,
            state,
        });
    });

    setAuthRoute(app, new AuthController());
    setUsariosRoutes(app, new UsuarioController());
    setBoardgameRoutes(app, new BoardgameController());

    return app;
};

const app = await buildServer(true);

const closeServer = async () => {
    console.log('the server is shutting down.');
    await app.close();
    await redis.quit();
    await redis.destroy();

    await prisma.$disconnect();
};

app.addHook('onClose', async (_) => await closeServer());

process.on('SIGTERM', async () => {
    await closeServer();
    process.exit(0);
});

if (!process.env.VITEST) {
    try {
        const address = await app.listen({
            port: Number(process.env.PORT) || 3000,
        });
        console.log(`Server running at ${address}`);
    } catch (err) {
        app.log.error(err);
        closeServer();

        process.exit(1);
    }
}
