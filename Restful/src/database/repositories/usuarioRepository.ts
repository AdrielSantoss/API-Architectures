import { Usuario } from '@prisma/client';
import { UsuarioDto, UsuariosDto } from '../../api/models/usuarioDto.js';
import { prisma } from '../prismaClient.js';
import { redis } from '../redisConnections.js';

const idempotencyKeyPrefix: string = 'idempotency:';
const idempotencyUsuarioIdPrefix: string = 'idempotency:usuario:';
const cacheUsuariosPrefix: string = 'usuarios:';

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

    // REDIS-IDEMPOTENCYKEY

    async getUsuarioIdempotencyKey(key: string): Promise<string | null> {
        return await redis.get(`${idempotencyKeyPrefix}${key}`);
    }

    async createUsuarioIdempotencyKey(
        id: number,
        key: string
    ): Promise<undefined> {
        const idempotencyKey = `${idempotencyKeyPrefix}${key}`;
        const reverseIndex = `${idempotencyUsuarioIdPrefix}${id}`;

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
        await redis.set(
            `${cacheUsuariosPrefix}${id}`,
            JSON.stringify(usuario),
            {
                expiration: {
                    type: 'EX',
                    value: 3600,
                },
            }
        );
    }

    async getUsuarioByIdRedis(id: number): Promise<string | null> {
        return await redis.get(`${cacheUsuariosPrefix}${id}`);
    }

    async insertUsuariosRedis(
        page: number,
        limit: number,
        usuarios: UsuariosDto
    ): Promise<string | null> {
        return await redis.set(
            `${cacheUsuariosPrefix}page:${page}:limit:${limit}`,
            JSON.stringify(usuarios),
            {
                expiration: {
                    type: 'EX',
                    value: 3600,
                },
            }
        );
    }

    async getUsuariosRedis(
        page: number,
        limit: number
    ): Promise<string | null> {
        return await redis.get(
            `${cacheUsuariosPrefix}page:${page}:limit:${limit}`
        );
    }
}
