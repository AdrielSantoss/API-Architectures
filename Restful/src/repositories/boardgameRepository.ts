import { Boardgame } from '@prisma/client';
import { BoardgameDto, BoardgamesDto } from '../models/boardgameDto';
import { prisma } from '../database/prismaClient';
import { redis } from '../database/redisConnections';

const idempotencyKeyPrefix: string = 'idempotency:';
const idempotencyBoardgameIdPrefix: string = 'idempotency:boardgame:';
const cacheBoardgamesPrefix: string = 'boardgames:';

export class BoardgameRepository {
    async getBoardgames(createdAt: Date | undefined, limit: number) {
        return await prisma.boardgame.findMany({
            where: {
                createdAt: {
                    gte: createdAt,
                },
            },
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

        await redis.set(idempotencyKey, id, {
            expiration: {
                type: 'EX',
                value: 3600,
            },
        });
        await redis.set(reverseIndex, idempotencyKey, {
            expiration: {
                type: 'EX',
                value: 3600,
            },
        });
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
        await redis.set(`${cacheBoardgamesPrefix}${id}:etag`, etag, {
            expiration: {
                type: 'EX',
                value: 3600,
            },
        });
    }

    async insertBoardgamesRedis(
        createdAt: Date | undefined,
        limit: number,
        boardgames: BoardgamesDto
    ): Promise<string | null> {
        return await redis.set(
            `${cacheBoardgamesPrefix}page:${createdAt?.toISOString()}:limit:${limit}`,
            JSON.stringify(boardgames),
            {
                expiration: {
                    type: 'EX',
                    value: 3600,
                },
            }
        );
    }

    async getBoardgamesRedis(
        createdAt: Date | undefined,
        limit: number
    ): Promise<string | null> {
        return await redis.get(
            `${cacheBoardgamesPrefix}createdAt:${createdAt?.toISOString()}:limit:${limit}`
        );
    }
}
