import { PrismaClient, Usuario } from '@prisma/client';
import { UsuarioDto } from '../models/usuarioDto.js';
import Redis from 'ioredis-mock';

export const prisma = new PrismaClient();
export const redis = new Redis();

const idempotencyKeyPrefix: string = 'idempotency:';
const idempotencyUsuarioIdPrefix: string = 'idempotency:usuario:';

export class UsuarioRepository {
    async getUsuarios(page: number, limit: number) {
        return await prisma.usuario.findMany({
            skip: (page - 1) * limit,
            take: limit + 1,
        });
    }

    async getUsuarioById(id: number): Promise<Usuario | null> {
        return await prisma.usuario.findUnique({
            where: {
                id: Number(id),
            },
        });
    }

    async createUsuario(newUsuario: UsuarioDto): Promise<Usuario> {
        return await prisma.usuario.create({
            data: {
                nome: newUsuario.nome,
                email: newUsuario.email,
            },
        });
    }

    async updateUsuario(id: number, newUsuario: UsuarioDto): Promise<Usuario> {
        return await prisma.usuario.update({
            where: {
                id: id,
            },
            data: {
                nome: newUsuario.nome,
                email: newUsuario.email,
            },
        });
    }

    async deleteUsuario(id: number): Promise<undefined> {
        await prisma.usuario.delete({
            where: {
                id: id,
            },
        });
    }

    // REDIS

    async getUsuarioIdempotencyKey(key: string): Promise<string | null> {
        return await redis.get(`${idempotencyKeyPrefix}${key}`);
    }

    async createUsuarioIdempotencyKey(
        id: number,
        key: string
    ): Promise<undefined> {
        const idempotencyKey = `${idempotencyKeyPrefix}${key}`;
        const reverseIndex = `${idempotencyUsuarioIdPrefix}${id}`;

        await redis.set(idempotencyKey, id, 'EX', 3600);
        await redis.set(reverseIndex, idempotencyKey, 'EX', 3600);
    }

    async deleteUsuarioIdempotencyKey(id: number) {
        const reverseIndex = `${idempotencyUsuarioIdPrefix}${id}`;
        const key = await redis.get(reverseIndex);

        if (!key) {
            return;
        }

        await redis.del(key);
        await redis.del(reverseIndex);
    }

    // REDIS-CACHE

    async insertUsuarioByIdRedis(id: number, usuario: UsuarioDto) {
        await redis.set(`usuario:${id}`, JSON.stringify(usuario), 'EX', 300);
    }

    async getUsuarioByIdRedis(id: number): Promise<string | null> {
        return await redis.get(`usuario:${id}`);
    }
}
