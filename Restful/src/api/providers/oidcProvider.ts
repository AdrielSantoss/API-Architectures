import * as oidc from 'oidc-provider';

export const authorizationServer = new oidc.Provider('http://localhost:3000', {
    clients: [
        {
            client_id: 'foo',
            client_secret: 'bar',
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
        return {
            accountId: id,
            async claims() {
                return {
                    sub: id,
                    email: id,
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
