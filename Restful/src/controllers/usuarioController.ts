import { Usuario } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UsuarioService } from '../services/usuarioService.js';
import { NewUsuarioDto, UsuariosDto } from '../models/usuarioDto.js';

interface IUsuarioController {
    getUsuarios(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<UsuariosDto | null>;
    getUsuarioById(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<Usuario | null>;
    createUsuario(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<undefined>;
    updateUsuario(): Promise<Usuario>;
    patchUsuario(): Promise<undefined>;
}

export class UsuarioController implements IUsuarioController {
    private usuarioService: UsuarioService;

    constructor() {
        this.usuarioService = new UsuarioService();
    }

    async getUsuarios(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<UsuariosDto | null> {
        const queryParams = request.query as { page?: string; limit?: string };

        return reply.send(
            await this.usuarioService.getUsuarios(
                Number(queryParams.page),
                Number(queryParams.limit)
            )
        );
    }

    async getUsuarioById(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<Usuario | null> {
        const { id } = request.params as { id: number };

        return reply.send(await this.usuarioService.getUsuarioById(id));
    }

    async createUsuario(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<undefined> {
        const newUsuario = request.body as NewUsuarioDto;
        this.usuarioService.createUsuario(newUsuario);

        return reply.code(201).send();
    }

    async updateUsuario(): Promise<Usuario> {
        throw new Error('Method not implemented.');
    }

    async patchUsuario(): Promise<undefined> {
        throw new Error('Method not implemented.');
    }
}
