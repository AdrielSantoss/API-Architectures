import { AppError } from './appError';

export class ConflictError extends AppError {
    constructor(message = 'Conflito de recurso.') {
        super(message, 409);
    }
}
