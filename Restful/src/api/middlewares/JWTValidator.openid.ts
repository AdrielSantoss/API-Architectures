import { FastifyReply, FastifyRequest } from 'fastify';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const port = process.env.PORT ?? '3000';
const JWKS = createRemoteJWKSet(new URL(`http://localhost:${port}/oidc/jwks`));

export async function oidcAuthMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const auth = request.headers.authorization;

    if (!auth?.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }

    const token = auth.substring('Bearer '.length);

    try {
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: 'http://localhost:' + port,
            audience: 'app',
        });

        request.user = payload;
    } catch (err) {
        console.log(err);
        return reply.status(401).send({ error: 'Invalid token' });
    }
}
