import { FastifyInstance } from 'fastify';
import { BoardgameController } from '../controllers/boardgameController';

export function setBoardgameRoutes(
    app: FastifyInstance,
    boardgameController: BoardgameController
) {
    app.get(
        '/boardgames',
        {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        limit: { type: 'integer', minimum: 1, default: 1 },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
        async (request, reply) =>
            boardgameController.getBoardgames(request, reply)
    );

    app.get(
        '/boardgames/:id',
        {
            schema: {
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', minimum: 0 },
                    },
                },
            },
        },
        async (request, reply) =>
            boardgameController.getBoardgameById(request, reply)
    );

    app.post(
        '/boardgames/:usuarioId',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['usuarioId'],
                    properties: {
                        usuarioId: { type: 'number', minimum: 0 },
                    },
                },
                body: {
                    type: 'object',
                    required: ['nome', 'descricao', 'complexidade'],
                    properties: {
                        nome: { type: 'string' },
                        descricao: { type: 'string' },
                        complexidade: { type: 'number' },
                        idade: { type: 'number' },
                        tempo: { type: 'number' },
                        ano: { type: 'number' },
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
        async (request, reply) =>
            boardgameController.createBoardgame(request, reply)
    );

    app.put(
        '/boardgames/:id',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['nome', 'descricao', 'complexidade'],
                    properties: {
                        nome: { type: 'string' },
                        descricao: { type: 'string' },
                        complexidade: { type: 'number' },
                        idade: { type: 'number' },
                        tempo: { type: 'number' },
                        ano: { type: 'number' },
                    },
                },
            },
        },
        async (request, reply) =>
            boardgameController.updateBoardgame(request, reply)
    );

    app.delete(
        '/boardgames/:id',
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
        async (request, reply) =>
            boardgameController.deleteBoardgame(request, reply)
    );
}
