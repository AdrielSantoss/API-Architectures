import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/authController';

export function setAuthRoute(
    app: FastifyInstance,
    authController: AuthController
) {
    app.post(
        '/auth/token',
        {
            schema: {
                headers: {
                    type: 'object',
                    required: ['X-API-KEY'],
                    properties: {
                        'x-api-key': {
                            type: 'string',
                        },
                    },
                },
            },
        },
        async (request, reply) =>
            authController.getAccessToken(app, request, reply)
    );
}
