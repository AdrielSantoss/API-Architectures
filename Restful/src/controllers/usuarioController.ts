import { Usuario } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UsuarioService } from '../services/usuarioService.js';
import { UsuarioDto, UsuariosDto } from '../models/usuarioDto.js';
import { BaseController } from './baseController.js';

interface IUsuarioController {
    getUsuarios(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<UsuariosDto | undefined>;
    getUsuarioById(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<Usuario | undefined>;
    createUsuario(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<undefined>;
    updateUsuario(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<UsuarioDto | undefined>;
    patchUsuario(): Promise<undefined>;
}

export class UsuarioController
    extends BaseController
    implements IUsuarioController
{
    private usuarioService: UsuarioService;

    constructor() {
        super();

        this.usuarioService = new UsuarioService();
    }

    async getUsuarios(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<UsuariosDto | undefined> {
        try {
            const queryParams = request.query as {
                page?: string;
                limit?: string;
            };

            return reply.send(
                await this.usuarioService.getUsuarios(
                    Number(queryParams.page),
                    Number(queryParams.limit)
                )
            );
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async getUsuarioById(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<Usuario | undefined> {
        try {
            const { id } = request.params as { id: number };

            return reply.send(await this.usuarioService.getUsuarioById(id));
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async createUsuario(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<undefined> {
        try {
            const newUsuario = request.body as UsuarioDto;
            const idempotencykey = request.headers.idempotencykey as string;

            const usuario = await this.usuarioService.createUsuario(
                newUsuario,
                idempotencykey
            );

            return reply.code(usuario?.created ? 201 : 200).send(usuario);
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async updateUsuario(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<UsuarioDto | undefined> {
        try {
            const { id } = request.params as { id: number };
            const newUsuario = request.body as UsuarioDto;

            const usuarioUpdated = await this.usuarioService.updateUsuario(
                id,
                newUsuario
            );

            return reply.send(usuarioUpdated);
        } catch (error) {
            this.throwResponseException(error, reply);
        }
    }

    async patchUsuario(): Promise<undefined> {
        throw new Error('Method not implemented.');
    }
}
