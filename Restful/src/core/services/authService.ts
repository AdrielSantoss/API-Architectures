import { JWT } from '@fastify/jwt';
import Provider from 'oidc-provider';
import { FastifyReply, FastifyRequest } from 'fastify';
import { InvalidApiKeyError } from '../errors/invalidApiKeyError';
import { UsuarioRepository } from '../../database/repositories/usuarioRepository';
import { UserNotFoundError } from '../errors/userNotFoundError';
import { InvalidUserCredentialsError } from '../errors/invalidUserCredentialsError';
import { comparePassword } from '../utils/bcrypt';

export class AuthService {
    private usuarioRepository: UsuarioRepository;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }

    async getAccessToken(
        apiKeyParam: string,
        jwt: JWT
    ): Promise<string | undefined> {
        if (apiKeyParam !== process.env.APIKEY) {
            throw new InvalidApiKeyError();
        }

        const token = jwt.sign({
            sub: 'user-id-123',
            roles: ['user'],
        });

        return token;
    }

    // OIDC

    async login(
        authorizationServer: Provider,
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        const { email, password } = request.body as {
            email: string;
            password: string;
        };

        const user = await this.usuarioRepository.getUsuarioByEmail(
            email,
            true
        );

        if (!user) {
            throw new UserNotFoundError();
        }

        const validPassword = await comparePassword(password, user.senha!);

        if (!validPassword) {
            throw new InvalidUserCredentialsError();
        }

        await authorizationServer.interactionFinished(
            request.raw,
            reply.raw,
            {
                login: { accountId: user.id!.toString(), remember: true },
            },
            { mergeWithLastSubmission: true }
        );
    }

    async confirmConsent(
        authorizationServer: Provider,
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        const { uid } = request.params as { uid: string };

        const interaction = await authorizationServer.interactionDetails(
            request.raw,
            reply.raw
        );

        const { params, session, grantId } = interaction;

        const grant: any = grantId
            ? await authorizationServer.Grant.find(grantId)
            : new authorizationServer.Grant({
                  accountId: session!.accountId,
                  clientId: params.client_id as string,
              });

        grant.addOIDCScope('openid email');

        const savedGrantId = await grant.save();

        await authorizationServer.interactionFinished(
            request.raw,
            reply.raw,
            {
                consent: {
                    grantId: savedGrantId,
                },
            },
            { mergeWithLastSubmission: true }
        );
    }

    async abortConsent(
        authorizationServer: Provider,
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        const { uid } = request.params as { uid: string };

        const accountId = 'user-123';

        await authorizationServer.interactionFinished(
            request.raw,
            reply.raw,
            {
                login: { accountId },
            },
            { mergeWithLastSubmission: true }
        );
    }
}
