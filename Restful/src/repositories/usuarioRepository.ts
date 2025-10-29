import { PrismaClient, Usuario } from '@prisma/client';
import { UsuarioDto } from '../models/usuarioDto.js';
import Redis from 'ioredis-mock';

export const prisma = new PrismaClient();
export const redis = new Redis();

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

    async getUsuarioIdempotencyKey(key: string): Promise<string | null> {
        return await redis.get(key);
    }

    async createUsuarioIdempotencyKey(id: number, key: string) {
        return await redis.set(key, id, 'EX', 3600);
    }
}
