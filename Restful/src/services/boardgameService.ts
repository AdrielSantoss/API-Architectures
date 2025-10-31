import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js';
import { InternalError } from '../errors/main/internalError.js';
import { DuplicateUserError } from '../errors/duplicateUserError.js';
import { UserNotFoundError } from '../errors/userNotFoundError.js';
import { BoardgameRepository } from '../repositories/boardgameRepository.js';
import { BoardgameDto, BoardgamesDto } from '../models/boardgameDto.js';
import { BoardgameNotFoundError } from '../errors/boardgameNotFoundError.js';
import { DuplicateBoardgameError } from '../errors/duplicateBoardgameError.js';

export class BoardgameService {
    private BoardgameRepository: BoardgameRepository;

    constructor() {
        this.BoardgameRepository = new BoardgameRepository();
    }

    async getBoardgames(
        page: number,
        limit: number
    ): Promise<BoardgamesDto | null> {
        try {
            const boardgamesCached =
                await this.BoardgameRepository.getBoardgamesRedis(page, limit);

            if (boardgamesCached) {
                return JSON.parse(boardgamesCached) as BoardgamesDto;
            }

            const boardgames = await this.BoardgameRepository.getBoardgames(
                page,
                limit
            );
            const hasNextPage = boardgames.length == limit + 1;

            boardgames.pop();

            const boardgameDto = {
                data: boardgames,
                meta: {
                    page,
                    limit,
                    hasNextPage: hasNextPage,
                },
            } as BoardgamesDto;

            await this.BoardgameRepository.insertBoardgamesRedis(
                page,
                limit,
                boardgameDto
            );

            return boardgameDto;
        } catch (error) {
            console.error('Erro interno ao consultar os boardgames.', error);

            throw new InternalError();
        }
    }

    async getBoardgameById(id: number): Promise<BoardgameDto | undefined> {
        const boardgameCached =
            await this.BoardgameRepository.getBoardgameByIdRedis(id);

        if (boardgameCached) {
            return JSON.parse(boardgameCached) as BoardgameDto;
        }

        const boardgame = await this.BoardgameRepository.getBoardgameById(id);

        if (!boardgame) {
            throw new BoardgameNotFoundError();
        }

        await this.BoardgameRepository.insertBoardgameByIdRedis(id, boardgame);

        return boardgame as BoardgameDto;
    }

    async createBoardgame(
        newBoardgame: BoardgameDto,
        usuarioId: number,
        idempotencyKey: string
    ): Promise<BoardgameDto> {
        try {
            let id: string | null = null;

            if (idempotencyKey) {
                id = await this.BoardgameRepository.getBoardgameIdempotencyKey(
                    idempotencyKey
                );
            }

            if (id !== null) {
                const getBoardgame =
                    await this.BoardgameRepository.getBoardgameById(Number(id));

                return {
                    nome: getBoardgame!.nome,
                    descricao: getBoardgame!.descricao,
                    ano: getBoardgame!.ano,
                    complexidade: getBoardgame!.complexidade,
                    idade: getBoardgame!.idade,
                    tempo: getBoardgame!.tempo,
                } as BoardgameDto;
            }

            const boardgame = await this.BoardgameRepository.createBoardgame(
                newBoardgame,
                usuarioId
            );

            await this.BoardgameRepository.createBoardgameIdempotencyKey(
                boardgame.id,
                idempotencyKey
            );

            return {
                ...boardgame,
                created: true,
            } as BoardgameDto;
        } catch (error: unknown) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new DuplicateBoardgameError();
            }

            console.error('Erro interno ao criar o boardgame:', error);
            throw new InternalError();
        }
    }

    async updateBoardgame(
        id: number,
        newBoardgame: BoardgameDto
    ): Promise<BoardgameDto> {
        try {
            const boardgameUpdated =
                await this.BoardgameRepository.updateBoardgame(
                    Number(id),
                    newBoardgame
                );

            return boardgameUpdated as BoardgameDto;
        } catch (error: unknown) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new BoardgameNotFoundError();
            }

            console.error('Erro interno ao editar o boardgame:', error);
            throw new InternalError();
        }
    }

    async deleteBoardgame(id: number): Promise<undefined> {
        try {
            await this.BoardgameRepository.deleteBoardgame(id);
            await this.BoardgameRepository.deleteBoardgameIdempotencyKey(id);
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new BoardgameNotFoundError();
            }

            console.error(
                'Erro interno ao deletar o boardgame de id:' + id,
                error
            );

            throw new InternalError();
        }
    }
}
