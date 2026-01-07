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

            const client = await authorizationServer.Client.find(
                interaction.params.client_id as string
            );

            if (prompt.name === 'login') {
                return reply.viewAsync('login.ejs', {
                    uid: interaction.uid,
                    error: null,
                });
            }

            if (prompt.name === 'consent') {
                return reply.view('consent.ejs', {
                    uid: uid,
                    clientName: client?.clientName,
                });
            }
        } catch (error) {
            console.log(error);
            this.throwResponseException(error, reply);
        }
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
                const details = await authorizationServer.interactionDetails(
                    request.raw,
                    reply.raw
                );

                const { uid } = details;

                return reply.viewAsync('login.ejs', {
                    uid: uid,
                    error: error.message,
                });
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
            console.log(error);
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
