import { PrismaClient, Usuario } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UsuariosDto } from '../models/usuarioDto';

const prisma = new PrismaClient();

interface IUsuarioSRepository {
    getUsuarios(page: number, limit: number): Promise<Usuario[] | null>;
    // getUsuarioById(): Promise<Usuario | null>
    // createUsuario(): Promise<undefined>
    // updateUsuario(): Promise<Usuario>
    // patchUsuario(): Promise<undefined>
}

export class UsuarioRepository implements IUsuarioSRepository {
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

    async createUsuario(): Promise<undefined> {
        throw new Error('Method not implemented.');
    }

    async updateUsuario(): Promise<Usuario> {
        throw new Error('Method not implemented.');
    }

    async patchUsuario(): Promise<undefined> {
        throw new Error('Method not implemented.');
    }
}
