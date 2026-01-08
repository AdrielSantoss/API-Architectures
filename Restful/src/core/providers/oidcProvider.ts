import * as oidc from 'oidc-provider';
import { prisma } from './prismaClientProvider';

export const authorizationServer = new oidc.Provider('http://localhost:3000', {
    clients: [
        {
            client_id: 'app',
            client_secret: 'bar-123-app',
            client_name: 'Aplicação de Testes',
            redirect_uris: ['http://localhost:3000/home'],
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
    },
});
