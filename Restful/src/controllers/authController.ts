import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { BaseController } from './baseController';

export class AuthController extends BaseController {
    apiKey: string = 'ceb61bab-e096-4835-8629-fd1b93b37179';

    async getAccessToken(
        app: FastifyInstance,
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<undefined> {
        try {
            const apiKeyParam = request.headers['x-api-key'] as string;

            if (apiKeyParam === this.apiKey) {
                const token = app.jwt.sign({
                    sub: 'user-id-123',
                    roles: ['user'],
                });

                console.log(token);

                return reply.code(200).send({ access_token: token });
            } else {
                return reply.code(401).send();
            }
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }
}
