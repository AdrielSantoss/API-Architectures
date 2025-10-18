import { PrismaClient, Usuario } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { UsuariosDto } from "../models/usuarioDto";
import { UsuarioRepository } from "../repositories/usuarioRepository";

const prisma = new PrismaClient()

interface IUsuarioService {
    getUsuarios(page: number, limit: number): Promise<UsuariosDto | null>
    // getUsuarioById(): Promise<Usuario | null>
    // createUsuario(): Promise<undefined>
    // updateUsuario(): Promise<Usuario>
    // patchUsuario(): Promise<undefined>
}

export class UsuarioService implements IUsuarioService {
    private usuarioRepository: UsuarioRepository;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }

    async getUsuarios(page: number, limit: number) {
        // 1. Offset pagination with lookahead
        
        const usuarios = await this.usuarioRepository.getUsuarios(page, limit);
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

    async getUsuarioById(id: number): Promise<Usuario | null> {
        if (!Number.isInteger(id)) {
            throw new Error("Invalid ID");
        }

        return await this.usuarioRepository.getUsuarioById(id);
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