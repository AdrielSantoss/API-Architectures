import Fastify from 'fastify';
import { setUsariosRoutes } from './api/routes/usuarioRoutes.js';
import { UsuarioController } from './api/controllers/usuarioController.js';
import { BoardgameController } from './api/controllers/boardgameController.js';
import { setBoardgameRoutes } from './api/routes/boardgameRoutes.js';

import { redis } from './core/providers/redisProvider.js';
import { prisma } from './core/providers/prismaClientProvider.js';
import { setAuthRoutes } from './api/routes/authRoutes.js';
import { AuthController } from './api/controllers/authController.js';
import { authorizationServer } from './core/providers/oidcProvider.js';
import { setFastifyPlugins } from './api/plugins/fastify.plugins.js';

export const buildServer = async (logger = false) => {
    let app = Fastify({ logger });

    await setFastifyPlugins(app);
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
