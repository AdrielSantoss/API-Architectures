import { FastifyInstance } from 'fastify';
import { UsuarioController } from '../controllers/usuarioController.js';

export function setUsariosRoutes(
    app: FastifyInstance,
    userController: UsuarioController
) {
    app.get(
        '/usuarios',
        {
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
        '/usuarios/:email',
        {
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        email: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) =>
            userController.getUsuarioByEmail(request, reply)
    );

    app.post(
        '/usuarios',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['email', 'senha'],
                    properties: {
                        nome: { type: 'string' },
                        email: { type: 'string' },
                        senha: { type: 'string' },
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
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', minimum: 0 },
                    },
                },
                body: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        nome: { type: 'string' },
                        email: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) => userController.updateUsuario(request, reply)
    );

    app.delete(
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
        async (request, reply) => userController.deleteUsuario(request, reply)
    );
}
