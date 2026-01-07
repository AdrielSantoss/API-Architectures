import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { BaseController } from './baseController';
import Provider from 'oidc-provider';
import { AuthService } from '../../core/services/authService';
import { UserNotFoundError } from '../../core/errors/userNotFoundError';
import { InvalidUserCredentialsError } from '../../core/errors/invalidUserCredentialsError';

export class AuthController extends BaseController {
    private authService: AuthService;

    constructor() {
        super();

        this.authService = new AuthService();
    }

    // API KEY + JWT

    async getAccessToken(
        app: FastifyInstance,
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<undefined> {
        try {
            const apiKeyParam = request.headers['x-api-key'] as string;
            const token = await this.authService.getAccessToken(
                apiKeyParam,
                app.jwt
            );

            return reply.send(token);
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    // OPENID CONNECT

    async getLoginOrConsentPage(
        authorizationServer: Provider,
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            const { uid } = request.params as { uid: string };

            const interaction = await authorizationServer.interactionDetails(
                request.raw,
                reply.raw
            );

            const { prompt } = interaction;

            if (prompt.name === 'login') {
                return reply.type('text/html').send(`
                    <h1>Login</h1>
                    <form method="post" action="/interaction/${uid}/login">
                        <input name="email" />
                        <input type="password" name="password" />
                        <button>Entrar</button>
                    </form>
            `);
            }

            if (prompt.name === 'consent') {
                return reply.type('text/html').send(`
                    <h1>Consentimento</h1>
                    <p>Este aplicativo quer acesso a:</p>
                    <ul>
                        <li>Email</li>
                        <li>Nome de usuário</li>
                    </ul>

                    <form method="post" action="/interaction/${uid}/consent/confirm">
                        <button>Aceitar</button>
                    </form>

                    <form method="post" action="/interaction/${uid}/consent/abort">
                        <button>Cancelar</button>
                    </form>
            `);
            }
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async renderLoginWithError(
        authorizationServer: Provider,
        request: FastifyRequest,
        reply: FastifyReply,
        message: string
    ) {
        const details = await authorizationServer.interactionDetails(
            request.raw,
            reply.raw
        );

        const { uid, prompt, params } = details;

        return reply.type('text/html').send(`
            <head>
                <meta charset="UTF-8" />
                <title>Login</title>
            </head>
            <h1>Login</h1>
            <form method="post" action="/interaction/${uid}/login">
                <input name="email" />
                <input type="password" name="password" />
                <button>Entrar</button>
                <div>${message}</div>
            </form>
        `);
    }

    async login(
        authorizationServer: Provider,
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            await this.authService.login(authorizationServer, request, reply);
        } catch (error) {
            if (
                error instanceof UserNotFoundError ||
                error instanceof InvalidUserCredentialsError
            ) {
                return this.renderLoginWithError(
                    authorizationServer,
                    request,
                    reply,
                    error.message
                );
            }

            this.throwResponseException(error, reply);
        }
    }

    async confirmConsent(
        authorizationServer: Provider,
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            await this.authService.confirmConsent(
                authorizationServer,
                request,
                reply
            );
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async abortConsent(
        authorizationServer: Provider,
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            await this.authService.abortConsent(
                authorizationServer,
                request,
                reply
            );
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }
}
