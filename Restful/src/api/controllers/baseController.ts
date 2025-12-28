import { FastifyReply } from 'fastify';
import { AppError } from '../../core/errors/main/appError';

export class BaseController {
    throwResponseException(error: unknown, reply: FastifyReply) {
        if (error instanceof AppError) {
            reply.status(error.statusCode).send({ message: error.message });
        } else {
            reply.status(500).send({ message: 'Erro interno.' });
        }
    }
}
