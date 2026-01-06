import Fastify from 'fastify';
import { setUsariosRoutes } from './api/routes/usuarioRoutes.js';
import { UsuarioController } from './api/controllers/usuarioController.js';
import { BoardgameController } from './api/controllers/boardgameController.js';
import { setBoardgameRoutes } from './api/routes/boardgameRoutes.js';

import { redis } from './database/redisConnections.js';
import { prisma } from './database/prismaClient.js';
import { setAuthRoutes } from './api/routes/authRoutes.js';
import { AuthController } from './api/controllers/authController.js';
import jwt from '@fastify/jwt';
import formbody from '@fastify/formbody';
import middie from '@fastify/middie';
import { authorizationServer } from './api/providers/oidcProvider.js';

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

    setAuthRoutes(app, new AuthController(), authorizationServer);
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
