import { UsuarioDto, UsuariosDto } from '../../api/models/usuarioDto.js';
import { UsuarioRepository } from '../../database/repositories/usuarioRepository.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js';
import { InternalError } from '../errors/main/internalError.js';
import { DuplicateUserError } from '../errors/duplicateUserError.js';
import { UserNotFoundError } from '../errors/userNotFoundError.js';
import { hashPassword } from '../utils/bcrypt.js';

export class UsuarioService {
    private usuarioRepository: UsuarioRepository;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }

    async getUsuarios(
        page: number,
        limit: number
    ): Promise<UsuariosDto | null> {
        try {
            const usuariosCached =
                await this.usuarioRepository.getUsuariosRedis(page, limit);

            if (usuariosCached) {
                return JSON.parse(usuariosCached) as UsuariosDto;
            }

            // Offset pagination with lookahead
            const usuarios = await this.usuarioRepository.getUsuarios(
                page,
                limit
            );
            const hasNextPage = usuarios.length == limit + 1;

            usuarios.pop();

            const usuariosDto = {
                data: usuarios,
                meta: {
                    page,
                    limit,
                    hasNextPage: hasNextPage,
                },
            } as UsuariosDto;

            await this.usuarioRepository.insertUsuariosRedis(
                page,
                limit,
                usuariosDto
            );

            return usuariosDto;
        } catch (error) {
            console.error('Erro interno ao consultar os usuários.', error);

            throw new InternalError();
        }
    }

    async getUsuarioByEmail(email: string): Promise<UsuarioDto | undefined> {
        const usuarioCached =
            await this.usuarioRepository.getUsuarioByEmailRedis(email);

        if (usuarioCached) {
            return JSON.parse(usuarioCached) as UsuarioDto;
        }

        const usuario = await this.usuarioRepository.getUsuarioByEmail(email);

        if (!usuario) {
            throw new UserNotFoundError();
        }

        await this.usuarioRepository.insertUsuarioByEmailRedis(email, usuario);

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
            let email: string | null = null;

            if (idempotencyKey) {
                email = await this.usuarioRepository.getUsuarioIdempotencyKey(
                    idempotencyKey
                );
            }

            if (email !== null) {
                const getUsuario =
                    await this.usuarioRepository.getUsuarioByEmail(email);

                return {
                    nome: getUsuario!.nome,
                    email: getUsuario!.email,
                } as UsuarioDto;
            }

            newUsuario.senha = await hashPassword(newUsuario.senha!);

            const usuario = await this.usuarioRepository.createUsuario(
                newUsuario
            );

            await this.usuarioRepository.createUsuarioIdempotencyKey(
                usuario.email,
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
