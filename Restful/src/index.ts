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

export const authorizationServer = new oidc.Provider(
    'http://localhost:3002/oidc',
    {
        clients: [
            {
                client_id: 'foo',
                client_secret: 'bar',
                redirect_uris: ['http://localhost:8080/cb'],
            },
        ],
    }
);

export const buildServer = (logger = false) => {
    let app = Fastify({ logger });

    app.register(jwt, {
        secret: process.env.JWT_SECRET!,
        sign: {
            expiresIn: '15m',
        },
    });

    app.all('/oidc/*', async (req, reply) => {
        const originalUrl = req.raw.url!;
        req.raw.url = originalUrl.replace(/^\/oidc/, '');

        await authorizationServer.callback()(req.raw, reply.raw);
        req.raw.url = originalUrl;

        reply.sent = true;
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
