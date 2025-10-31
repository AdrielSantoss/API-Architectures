import Fastify from 'fastify';
import { setUsariosRoutes } from './routes/usuarioRoutes.js';
import { UsuarioController } from './controllers/usuarioController.js';
import { prisma, redis } from './repositories/usuarioRepository.js';
import { BoardgameController } from './controllers/boardgameController.js';
import { setBoardgameRoutes } from './routes/boardgameRoutes.js';

export const buildServer = (logger = false) => {
    let app = Fastify({ logger });

    setUsariosRoutes(app, new UsuarioController());
    setBoardgameRoutes(app, new BoardgameController());

    return app;
};

const app = buildServer(true);

app.addHook('onClose', async (_) => {
    console.log('the server is shutting down.');
    await redis.quit();
    await prisma.$disconnect();
});

process.on('SIGTERM', async () => {
    await app.close();
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
        await app.close();
        process.exit(1);
    }
}
