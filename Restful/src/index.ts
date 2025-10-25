import Fastify from 'fastify';
import { setUsariosRoutes } from './routes/usuarioRoutes';
import { UsuarioController } from './controllers/usuarioController';

export const buildServer = (logger = false) => {
    let app = Fastify({ logger });

    setUsariosRoutes(app, new UsuarioController());

    return app;
};

const app = buildServer(true);

if (!process.env.VITEST) {
    app.listen({ port: 3000 }, (err, address) => {
        if (err) {
            app.log.error(err);
            process.exit(1);
        }

        console.log(`Server running at ${address}`);
    });
}
