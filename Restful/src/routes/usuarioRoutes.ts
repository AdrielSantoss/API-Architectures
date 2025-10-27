import { FastifyInstance } from 'fastify';
import { UsuarioController } from '../controllers/usuarioController.js';

export function setUsariosRoutes(
    app: FastifyInstance,
    userController: UsuarioController
) {
    app.get(
        '/usuarios',
        {
            // Todo: Maybe move to another function
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', minimum: 1, default: 1 },
                        limit: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 10,
                            default: 10,
                        },
                    },
                },
            },
        },
        async (request, reply) => userController.getUsuarios(request, reply)
    );

    app.get(
        '/usuarios/:id',
        {
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', minimum: 1 },
                    },
                },
            },
        },
        async (request, reply) => userController.getUsuarioById(request, reply)
    );

    app.post(
        '/usuarios',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        nome: { type: 'string' },
                        email: { type: 'string' },
                    },
                },
                headers: {
                    type: 'object',
                    required: ['idempotencykey'],
                    properties: {
                        idempotencykey: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) => userController.createUsuario(request, reply)
    );

    app.put(
        '/usuarios/:id',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['email', 'nome'],
                    properties: {
                        nome: { type: 'string' },
                        email: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) => userController.updateUsuario(request, reply)
    );
}
