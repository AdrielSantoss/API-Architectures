import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/authController';
import Provider from 'oidc-provider';

export function setAuthRoutes(
    app: FastifyInstance,
    authController: AuthController,
    authorizationServer: Provider
) {
    app.post(
        '/auth/token',
        {
            schema: {
                headers: {
                    type: 'object',
                    required: ['X-API-KEY'],
                    properties: {
                        'X-API-KEY': {
                            type: 'string',
                        },
                    },
                },
            },
        },
        async (request, reply) =>
            authController.getAccessToken(app, request, reply)
    );

    // OIDC

    app.get('/interaction/:uid', async (req, reply) =>
        authController.getLoginOrConsentPage(authorizationServer, req, reply)
    );

    app.post('/interaction/:uid/login', async (req, reply) =>
        authController.login(authorizationServer, req, reply)
    );

    app.post('/interaction/:uid/consent/confirm', async (req, reply) =>
        authController.confirmConsent(authorizationServer, req, reply)
    );

    app.post(
        '/interaction/:uid/consent/abort',
        async (req, reply) =>
            await authorizationServer.interactionFinished(req.raw, reply.raw, {
                error: 'access_denied',
                error_description: 'Usuário negou o consentimento',
            })
    );

    app.get('/home', async (req, reply) => {
        const { code, state, error } = req.query as {
            code?: string;
            state?: string;
            error?: string;
        };

        reply.send({
            message: error ? 'Acesso Negado' : 'Authorization Code recebido',
            code,
            state,
        });
    });
}
