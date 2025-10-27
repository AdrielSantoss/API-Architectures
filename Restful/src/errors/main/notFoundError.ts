import { AppError } from './appError';

export class NotFoundError extends AppError {
    constructor(message = 'Conteúdo não encontrado.') {
        super(message, 404);
    }
}
