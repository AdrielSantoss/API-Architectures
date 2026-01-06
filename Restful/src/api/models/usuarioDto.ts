import { Usuario } from '@prisma/client';
import { PagingDto } from './pagingDto.js';

export interface UsuariosDto {
    data: Usuario[] | null;
    meta: PagingDto;
}

export interface UsuarioDto {
    nome: string | null | undefined;
    email: string;
    senha?: string;
    created?: boolean | undefined;
}
