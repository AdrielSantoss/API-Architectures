import { jwtVerify, createRemoteJWKSet, createLocalJWKSet } from 'jose';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { JWKSLocal } from '../../core/utils/vitest';

const JWKS = createRemoteJWKSet(new URL('http://localhost:3000/oidc/jwks'));
const port = process.env.PORT || 3000;

export async function oidcAuthMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const auth = request.headers.authorization;
        if (!auth) {
            return reply.status(401).send({ message: 'Token ausente' });
        }

        const token = auth.replace('Bearer ', '');

        if (process.env.VITEST) {
            const { payload } = await jwtVerify(token, JWKSLocal, {
                issuer: `http://localhost:${port}`,
                audience: `http://localhost:${port}`,
            });
            return;
        }

        const { payload } = await jwtVerify(token, JWKS, {
            issuer: `http://localhost:${port}`,
            audience: `http://localhost:${port}`,
        });

        request.user = payload;
    } catch (err) {
        console.error(err);
        return reply.status(401).send({ message: 'Token inválido' });
    }
}
