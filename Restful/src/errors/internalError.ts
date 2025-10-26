import { AppError } from './appError';

export class InternalError extends AppError {
    constructor(message = 'Erro interno.') {
        super(message, 500);
    }
}
