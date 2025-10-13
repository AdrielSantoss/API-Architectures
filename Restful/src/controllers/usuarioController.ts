import { PrismaClient, Usuario } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { UsuariosDto } from "../models/usuarioDto";
import { PagingDto } from "../models/pagingDto";

const prisma = new PrismaClient()

interface IUsuarioController {
    getUsuarios(request: FastifyRequest, reply: FastifyReply): Promise<Usuario[] | null>
    getUsuarioById(): Promise<Usuario | null>
    createUsuario(): Promise<undefined>
    updateUsuario(): Promise<Usuario>
    patchUsuario(): Promise<undefined>
}

export class UsuarioController implements IUsuarioController {
    async getUsuarios(request: FastifyRequest, reply: FastifyReply) {
        const queryParams = request.query as { page?: string; limit?: string };
        
        let page = Number(queryParams.page ?? 1);
        let limit = Number(queryParams.limit ?? 10);

        if (!Number.isInteger(page) || page <= 0) {
            return reply.status(400).send('The "page" param must be a positive integer.');
        }

        if (!Number.isInteger(limit) || limit <= 0 || limit > 10) {
            return reply.status(400).send('The "limit" param must be an integer between 1 and 10.');
        }

        const usuarios = await prisma.usuario.findMany({
            skip: (page - 1) * limit,
            take: limit + 1
        });

        const hasNextPage = usuarios.length == (limit + 1);

        usuarios.pop();

        return reply.send({
            data: usuarios,
            meta: {
                page,
                limit,
                hasNextPage: hasNextPage
            } 
        } as UsuariosDto);
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