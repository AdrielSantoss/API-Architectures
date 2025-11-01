import { Boardgame } from '@prisma/client';
import { PagingDto } from './pagingDto';

export interface BoardgamesDto {
    data: Boardgame[] | null;
    meta: PagingDto;
}

export interface BoardgameDto {
    nome: string;
    descricao: string;
    complexidade: number;
    idade?: number | null;
    tempo: number | null;
    ano?: number | null;
    created?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}
