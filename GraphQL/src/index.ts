// Import the framework and instantiate it
import Fastify from 'fastify';
import mercurius from 'mercurius';
export const app = Fastify({
    logger: true,
});

const schema = `
  type Query {
    add(x: Int, y: Int): Int
  }
`;

const resolvers = {
    Query: {
        add: async (_: any, { x, y }: { x: number; y: number }) => x + y,
    },
};

app.register(mercurius, {
    schema,
    resolvers,
});

app.get('/', async function (req, reply) {
    const query = '{ add(x: 2, y: 2) }';
    return reply.graphql(query);
});

if (!process.env.VITEST) {
    try {
        const address = await app.listen({
            port: Number(process.env.PORT) || 3000,
        });
        console.log(`Server running at ${address}`);
    } catch (err) {
        app.log.error(err);

        process.exit(1);
    }
}
