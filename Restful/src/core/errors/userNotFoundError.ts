import { NotFoundError } from './main/notFoundError';

export class UserNotFoundError extends NotFoundError {
    constructor(message = 'Usuário não encontrado.') {
        super(message);
    }
}
