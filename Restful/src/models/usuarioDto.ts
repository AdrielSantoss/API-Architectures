import { Usuario } from '@prisma/client';
import { PagingDto } from './pagingDto.js';

export interface UsuariosDto {
    data: Usuario[] | null;
    meta: PagingDto;
}

export interface NewUsuarioDto {
    name: string;
    email: string;
}
