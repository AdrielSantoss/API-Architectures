import { PrismaClient, Usuario } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { UsuariosDto } from "../models/usuarioDto";

const prisma = new PrismaClient()

interface IUsuarioService {
    getUsuarios(page: number, limit: number): Promise<UsuariosDto | null>
    // getUsuarioById(): Promise<Usuario | null>
    // createUsuario(): Promise<undefined>
    // updateUsuario(): Promise<Usuario>
    // patchUsuario(): Promise<undefined>
}

export class UsuarioService implements IUsuarioService {
    async getUsuarios(page: number, limit: number) {
        // 1. Offset pagination with lookahead

        const usuarios = await prisma.usuario.findMany({
            skip: (page - 1) * limit,
            take: limit + 1
        });

        const hasNextPage = usuarios.length == (limit + 1);

        usuarios.pop();

        return {
            data: usuarios,
            meta: {
                page,
                limit,
                hasNextPage: hasNextPage
            } 
        };
    }

    async getUsuarioById(): Promise<Usuario | null> {
        throw new Error("Method not implemented.");
    }

    async createUsuario(): Promise<undefined> {
        throw new Error("Method not implemented.");
    }

    async updateUsuario(): Promise<Usuario> {
        throw new Error("Method not implemented.");
    }

    async patchUsuario(): Promise<undefined> {
        throw new Error("Method not implemented.");
    }
}