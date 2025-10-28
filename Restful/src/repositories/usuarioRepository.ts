import { PrismaClient, Usuario } from '@prisma/client';
import { UsuarioDto } from '../models/usuarioDto.js';

export const prisma = new PrismaClient();

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

    async patchUsuario(): Promise<undefined> {
        throw new Error('Method not implemented.');
    }
}
