import Fastify from 'fastify';
import { setUsariosRoutes } from './routes/usuarioRoutes.js';
import { UsuarioController } from './controllers/usuarioController.js';
import { BoardgameController } from './controllers/boardgameController.js';
import { setBoardgameRoutes } from './routes/boardgameRoutes.js';

import { redis } from './database/redisConnections.js';
import { prisma } from './database/prismaClient.js';

export const buildServer = (logger = false) => {
    let app = Fastify({ logger });

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
