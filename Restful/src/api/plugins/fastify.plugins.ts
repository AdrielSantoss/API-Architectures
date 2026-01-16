import { buildServer } from '../..';
import path from 'path';
import ejs from 'ejs';
import { fileURLToPath } from 'node:url';
import jwt from '@fastify/jwt';
import formbody from '@fastify/formbody';
import middie from '@fastify/middie';
import view from '@fastify/view';
import fastifyStatic from '@fastify/static';
import { authorizationServer } from '../../core/providers/oidcProvider';

export async function setFastifyPlugins(
    app: Awaited<ReturnType<typeof buildServer>>
) {
    await app.register(jwt, {
        secret: process.env.JWT_SECRET!,
        sign: {
            expiresIn: '15m',
        },
    });

    await app.register(formbody);

    app.register(middie).after(() => {
        app.use('/oidc', authorizationServer.callback());
    });

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    console.log('diretório:', __dirname);

    await app.register(view, {
        engine: {
            ejs: ejs,
        },
        root: path.join(__dirname, '..', 'views'),
    });

    app.register(fastifyStatic, {
        root: path.join(__dirname, '..', 'assets'),
        prefix: '/assets/',
    });
}
