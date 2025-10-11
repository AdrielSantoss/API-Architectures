import { Usuario } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";

interface IUsuarioController {
    getUsuarios(request: FastifyRequest, reply: FastifyReply): Promise<Usuario[] | null>
    getUsuarioById(): Promise<Usuario | null>
    createUsuario(): Promise<undefined>
    updateUsuario(): Promise<Usuario>
    patchUsuario(): Promise<undefined>
}

export class UsuarioController implements IUsuarioController {
    async getUsuarios(request: FastifyRequest, reply: FastifyReply): Promise<Usuario[] | null> {
        return reply.send({ hello: 'world' });
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