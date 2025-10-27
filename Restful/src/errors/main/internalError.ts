import { AppError } from './appError.js';

export class InternalError extends AppError {
    constructor(message = 'Erro interno.') {
        super(message, 500);
    }
}
