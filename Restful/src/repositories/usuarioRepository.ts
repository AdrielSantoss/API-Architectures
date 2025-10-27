import { PrismaClient, Usuario } from '@prisma/client';
import { UsuarioDto } from '../models/usuarioDto.js';

export const prisma = new PrismaClient();

interface IUsuarioSRepository {
    getUsuarios(page: number, limit: number): Promise<Usuario[] | null>;
    getUsuarioById(id: number): Promise<Usuario | null>;
    createUsuario(newUsuario: UsuarioDto): Promise<Usuario>;
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

    async createUsuario(newUsuario: UsuarioDto): Promise<Usuario> {
        console.log('created!');
        return await prisma.usuario.create({
            data: {
                nome: newUsuario.nome,
                email: newUsuario.email,
            },
        });
    }

    async updateUsuario(): Promise<Usuario> {
        throw new Error('Method not implemented.');
    }

    async patchUsuario(): Promise<undefined> {
        throw new Error('Method not implemented.');
    }
}
