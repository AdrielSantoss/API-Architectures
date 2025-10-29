import { UsuarioDto } from '../models/usuarioDto.js';
import { UsuarioRepository } from '../repositories/usuarioRepository.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js';
import { InternalError } from '../errors/main/internalError.js';
import { DuplicateUserError } from '../errors/duplicateUserError.js';
import { UserNotFoundError } from '../errors/userNotFoundError.js';

export class UsuarioService {
    private usuarioRepository: UsuarioRepository;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }

    async getUsuarios(page: number, limit: number) {
        try {
            // Offset pagination with lookahead
            const usuarios = await this.usuarioRepository.getUsuarios(
                page,
                limit
            );
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
        } catch (error) {
            console.error('Erro interno ao consultar os usuários.', error);

            throw new InternalError();
        }
    }

    async getUsuarioById(id: number): Promise<UsuarioDto | undefined> {
        const usuarioCached = await this.usuarioRepository.getUsuarioByIdRedis(
            id
        );

        if (usuarioCached) {
            return JSON.parse(usuarioCached) as UsuarioDto;
        }

        const usuario = await this.usuarioRepository.getUsuarioById(id);

        if (!usuario) {
            throw new UserNotFoundError();
        }

        await this.usuarioRepository.insertUsuarioByIdRedis(id, usuario);

        return {
            nome: usuario?.nome,
            email: usuario?.email,
        } as UsuarioDto;
    }

    async createUsuario(
        newUsuario: UsuarioDto,
        idempotencyKey: string
    ): Promise<UsuarioDto> {
        try {
            let id: string | null = null;

            if (idempotencyKey) {
                id = await this.usuarioRepository.getUsuarioIdempotencyKey(
                    idempotencyKey
                );
            }

            if (id !== null) {
                const getUsuario = await this.usuarioRepository.getUsuarioById(
                    Number(id)
                );

                return {
                    nome: getUsuario!.nome,
                    email: getUsuario!.email,
                } as UsuarioDto;
            }

            const usuario = await this.usuarioRepository.createUsuario(
                newUsuario
            );

            await this.usuarioRepository.createUsuarioIdempotencyKey(
                usuario.id,
                idempotencyKey
            );

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

    async updateUsuario(
        id: number,
        newUsuario: UsuarioDto
    ): Promise<UsuarioDto> {
        try {
            const usuarioUpdated = await this.usuarioRepository.updateUsuario(
                Number(id),
                newUsuario
            );

            return {
                nome: usuarioUpdated.nome,
                email: usuarioUpdated.email,
            } as UsuarioDto;
        } catch (error: unknown) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new UserNotFoundError();
            }

            console.error('Erro interno ao editar usuário:', error);
            throw new InternalError();
        }
    }

    async deleteUsuario(id: number): Promise<undefined> {
        try {
            await this.usuarioRepository.deleteUsuario(id);
            await this.usuarioRepository.deleteUsuarioIdempotencyKey(id);
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new UserNotFoundError();
            }

            console.error(
                'Erro interno ao deletar o usuário de id:' + id,
                error
            );

            throw new InternalError();
        }
    }
}
