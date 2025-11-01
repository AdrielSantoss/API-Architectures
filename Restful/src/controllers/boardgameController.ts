import { FastifyReply, FastifyRequest } from 'fastify';
import { BaseController } from './baseController.js';
import { BoardgameService } from '../services/boardgameService.js';
import { BoardgameDto } from '../models/boardgameDto.js';

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
                page?: string;
                limit?: string;
            };

            return reply.send(
                await this.boardgameService.getBoardgames(
                    Number(queryParams.page),
                    Number(queryParams.limit)
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

            return reply.send(await this.boardgameService.getBoardgameById(id));
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
