import { PrismaClient, Boardgame } from '@prisma/client';
import Redis from 'ioredis-mock';
import { BoardgameDto, BoardgamesDto } from '../models/boardgameDto';

export const prisma = new PrismaClient();
export const redis = new Redis();

const idempotencyKeyPrefix: string = 'idempotency:';
const idempotencyBoardgameIdPrefix: string = 'idempotency:boardgame:';
const cacheBoardgamesPrefix: string = 'boardgames:';

export class BoardgameRepository {
    async getBoardgames(page: number, limit: number) {
        return await prisma.boardgame.findMany({
            skip: (page - 1) * limit,
            take: limit + 1,
        });
    }

    async getBoardgameById(id: number): Promise<Boardgame | null> {
        return await prisma.boardgame.findUnique({
            where: {
                id: Number(id),
            },
        });
    }

    async createBoardgame(
        newBoardgame: BoardgameDto,
        usuarioId: number
    ): Promise<Boardgame> {
        return await prisma.boardgame.create({
            data: {
                nome: newBoardgame.nome,
                descricao: newBoardgame.descricao,
                complexidade: newBoardgame.complexidade,
                ano: newBoardgame.ano,
                idade: newBoardgame.idade,
                tempo: newBoardgame.tempo,
                usuarioId: usuarioId,
            },
        });
    }

    async updateBoardgame(
        id: number,
        newBoardgame: BoardgameDto
    ): Promise<Boardgame> {
        return await prisma.boardgame.update({
            where: {
                id: id,
            },
            data: {
                nome: newBoardgame.nome,
                descricao: newBoardgame.descricao,
                complexidade: newBoardgame.complexidade,
                ano: newBoardgame.ano,
                idade: newBoardgame.idade,
                tempo: newBoardgame.tempo,
            },
        });
    }

    async deleteBoardgame(id: number): Promise<undefined> {
        await prisma.boardgame.delete({
            where: {
                id: id,
            },
        });
    }

    // REDIS-IDEMPOTENCYKEY

    async getBoardgameIdempotencyKey(key: string): Promise<string | null> {
        return await redis.get(`${idempotencyKeyPrefix}${key}`);
    }

    async createBoardgameIdempotencyKey(
        id: number,
        key: string
    ): Promise<undefined> {
        const idempotencyKey = `${idempotencyKeyPrefix}${key}`;
        const reverseIndex = `${idempotencyBoardgameIdPrefix}${id}`;

        await redis.set(idempotencyKey, id, 'EX', 3600);
        await redis.set(reverseIndex, idempotencyKey, 'EX', 3600);
    }

    async deleteBoardgameIdempotencyKey(id: number) {
        const reverseIndex = `${idempotencyBoardgameIdPrefix}${id}`;
        const key = await redis.get(reverseIndex);

        if (!key) {
            return;
        }

        await redis.del(key);
        await redis.del(reverseIndex);
    }

    // REDIS-CACHE

    async getBoardgameByIdRedisEtag(id: number): Promise<string | null> {
        return redis.get(`${cacheBoardgamesPrefix}${id}:etag`);
    }

    async insertBoardgameByIdRedisEtag(id: number, etag: string) {
        await redis.set(`${cacheBoardgamesPrefix}${id}:etag`, etag, 'EX', 60);
    }

    async insertBoardgamesRedis(
        page: number,
        limit: number,
        boardgames: BoardgamesDto
    ): Promise<string | null> {
        return await redis.set(
            `${cacheBoardgamesPrefix}page:${page}:limit:${limit}`,
            JSON.stringify(boardgames),
            'EX',
            60
        );
    }

    async getBoardgamesRedis(
        page: number,
        limit: number
    ): Promise<string | null> {
        return await redis.get(
            `${cacheBoardgamesPrefix}page:${page}:limit:${limit}`
        );
    }
}
