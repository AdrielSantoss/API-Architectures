import { Usuario } from '@prisma/client';
import { UsuarioDto, UsuariosDto } from '../models/usuarioDto.js';
import { UsuarioRepository } from '../repositories/usuarioRepository.js';
import Redis from 'ioredis-mock';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js';
import { InternalError } from '../errors/internalError.js';
import { DuplicateUserError } from '../errors/duplicateUserError.js';

export const redis = new Redis();

interface IUsuarioService {
    getUsuarios(page: number, limit: number): Promise<UsuariosDto | null>;
    getUsuarioById(id: number): Promise<UsuarioDto | undefined>;
    createUsuario(
        newUsuario: UsuarioDto,
        idempotencyKey?: string
    ): Promise<UsuarioDto>;
    // updateUsuario(): Promise<Usuario>
    // patchUsuario(): Promise<undefined>
}

export class UsuarioService implements IUsuarioService {
    private usuarioRepository: UsuarioRepository;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }

    async getUsuarios(page: number, limit: number) {
        // Offset pagination with lookahead

        const usuarios = await this.usuarioRepository.getUsuarios(page, limit);
        const hasNextPage = usuarios.length == limit + 1;

        usuarios.pop();

        return {
            data: usuarios,
            meta: {
                page,
                limit,
                hasNextPage: hasNextPage,
            },
        };
    }

    async getUsuarioById(id: number): Promise<UsuarioDto | undefined> {
        const usuario = await this.usuarioRepository.getUsuarioById(id);

        if (usuario) {
            return {
                nome: usuario?.nome,
                email: usuario?.email,
            } as UsuarioDto;
        }
    }

    async createUsuario(
        newUsuario: UsuarioDto,
        idempotencyKey: string
    ): Promise<UsuarioDto> {
        try {
            let id: string | null = null;

            if (idempotencyKey) {
                id = await redis.get(idempotencyKey);
            }

            if (id !== null) {
                return (await this.getUsuarioById(Number(id))) as UsuarioDto;
            }

            const usuario = await this.usuarioRepository.createUsuario(
                newUsuario
            );

            await redis.set(idempotencyKey, usuario.id, 'EX', 3600);
            return {
                nome: usuario.nome,
                email: usuario.email,
                created: true,
            } as UsuarioDto;
        } catch (error: unknown) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new DuplicateUserError();
            }

            console.error('Erro interno ao criar usuário:', error);
            throw new InternalError();
        }
    }

    async updateUsuario(): Promise<Usuario> {
        throw new Error('Method not implemented.');
    }

    async patchUsuario(): Promise<undefined> {
        throw new Error('Method not implemented.');
    }
}
