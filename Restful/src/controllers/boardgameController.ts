import { FastifyReply, FastifyRequest } from 'fastify';
import { BaseController } from './baseController.js';
import { BoardgameService } from '../services/boardgameService.js';
import { BoardgameDto } from '../models/boardgameDto.js';

export class BoardgameController extends BaseController {
    private Boardgameervice: BoardgameService;

    constructor() {
        super();

        this.Boardgameervice = new BoardgameService();
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
                await this.Boardgameervice.getBoardgames(
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

            return reply.send(await this.Boardgameervice.getBoardgameById(id));
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

            const Boardgame = await this.Boardgameervice.createBoardgame(
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

            const BoardgameUpdated = await this.Boardgameervice.updateBoardgame(
                id,
                newBoardgame
            );

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

            await this.Boardgameervice.deleteBoardgame(id);

            return reply.code(204).send();
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }
}
