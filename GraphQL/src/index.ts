// Import the framework and instantiate it
import Fastify from 'fastify';
export const app = Fastify({
    logger: true,
});

app.get('/', async function handler(request, reply) {
    return { hello: 'world' };
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
