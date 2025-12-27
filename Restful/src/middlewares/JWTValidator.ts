import { FastifyReply, FastifyRequest } from 'fastify';

export default async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await request.jwtVerify();
    } catch {
        reply.status(401).send({ message: 'Token inválido ou expirado' });
    }
};
