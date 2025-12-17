import { FastifyReply, FastifyRequest } from 'fastify';
import { BaseController } from './baseController.js';
import { BoardgameService } from '../services/boardgameService.js';
import { BoardgameDto } from '../models/boardgameDto.js';
import { boardgameQueue } from '../queues/boardgameQueue.js';

export class BoardgameController extends BaseController {
    private boardgameService: BoardgameService;

    constructor() {
        super();

        this.boardgameService = new BoardgameService();
    }

    async getBoardgames(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<BoardgameDto | undefined> {
        try {
            const queryParams = request.query as {
                limit?: number;
                createdAt?: string;
            };

            return reply.send(
                await this.boardgameService.getBoardgames(
                    Number(queryParams.limit),
                    queryParams.createdAt
                        ? new Date(queryParams.createdAt!)
                        : undefined
                )
            );
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async getBoardgameById(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<BoardgameDto | undefined> {
        try {
            const { id } = request.params as { id: number };
            const ifNoneMatch = request.headers['if-none-match'];

            const result = await this.boardgameService.getBoardgameById(
                id,
                ifNoneMatch
            );

            if (!result) {
                reply.code(304).send();
                return;
            }

            reply.header('Cache-Control', 'public, max-age=60');
            reply.header('ETag', result.etag);
            return reply.send(result.boardgame);
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async getBoardgameRulebook(
        _: FastifyRequest,
        reply: FastifyReply
    ): Promise<BoardgameDto | undefined> {
        try {
            reply.type('application/pdf');

            return reply.send(
                await this.boardgameService.getBoardgameRulebook()
            );
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async createBoardgame(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<undefined> {
        try {
            const newBoardgame = request.body as BoardgameDto;
            const idempotencykey = request.headers.idempotencykey as string;
            const { usuarioId } = request.params as { usuarioId: number };

            const Boardgame = await this.boardgameService.createBoardgame(
                newBoardgame,
                usuarioId,
                idempotencykey
            );

            return reply.code(Boardgame?.created ? 201 : 200).send(Boardgame);
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async createBoardgamesBatch(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<undefined> {
        try {
            const boardgames = request.body as BoardgameDto[];
            const idempotencykey = request.headers.idempotencykey as string; // depois
            const { usuarioId } = request.params as { usuarioId: number };

            await boardgameQueue.add(
                'boardgame-queue',
                {
                    boardgames,
                    usuarioId,
                },
                {
                    removeOnComplete: true,
                    removeOnFail: false,
                }
            );

            return reply.code(202).send({
                message: 'Boardgames enfileirado para processamento',
            });
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async updateBoardgame(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<BoardgameDto | undefined> {
        try {
            const { id } = request.params as { id: number };
            const newBoardgame = request.body as BoardgameDto;

            const BoardgameUpdated =
                await this.boardgameService.updateBoardgame(id, newBoardgame);

            return reply.send(BoardgameUpdated);
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async deleteBoardgame(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<undefined> {
        try {
            const { id } = request.params as { id: number };

            await this.boardgameService.deleteBoardgame(id);

            return reply.code(204).send();
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }
}
