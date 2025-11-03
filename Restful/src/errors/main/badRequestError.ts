import { AppError } from './appError';

export class BadRequestError extends AppError {
    constructor(message = 'Requisição inválida.') {
        super(message, 409);
    }
}
