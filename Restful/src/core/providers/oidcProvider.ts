import * as oidc from 'oidc-provider';
import { prisma } from './prismaClientProvider';

const port = process.env.PORT ?? '3000';

const resourceServer: oidc.ResourceServer = {
    scope: 'openid email',
    audience: `http://localhost:${port}`,
    accessTokenFormat: 'jwt',
    accessTokenTTL: 3600,
    jwt: {
        sign: {
            alg: 'RS256',
        },
    },
};

export const authorizationServer = new oidc.Provider(
    'http://localhost:' + port,
    {
        clients: [
            {
                client_id: 'app',
                client_secret: 'bar-123-app',
                client_name: 'Aplicação de Testes',
                redirect_uris: [`http://localhost:${port}/home`],
                response_types: ['code'],
                grant_types: ['authorization_code'],
                token_endpoint_auth_method: 'none',
            },
        ],
        pkce: {
            required: () => true,
        },
        findAccount: async (ctx, id) => {
            // id === accountId (user.id)
            const user = await prisma.usuario.findUnique({
                where: { id: Number(id) },
            });

            if (!user) return undefined;

            return {
                accountId: user.id.toString(),

                async claims(use, scope) {
                    return {
                        sub: user.id.toString(),
                        email: user.email,
                        name: user.nome,
                    };
                },
            };
        },

        interactions: {
            url(ctx, interaction) {
                return `/interaction/${interaction.uid}`;
            },
        },

        features: {
            devInteractions: { enabled: false },
            resourceIndicators: {
                enabled: true,
                getResourceServerInfo: async (
                    _: oidc.KoaContextWithOIDC,
                    __: string,
                    ___: oidc.Client
                ) => {
                    return resourceServer;
                },
            },
        },
    }
);
