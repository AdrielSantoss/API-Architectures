import { AppError } from './appError';

export class UnathorizedError extends AppError {
    constructor(message = 'Não possui permissão para acessar o recurso.') {
        super(message, 401);
    }
}
