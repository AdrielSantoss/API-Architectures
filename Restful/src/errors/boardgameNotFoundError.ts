import { NotFoundError } from './main/notFoundError';

export class BoardgameNotFoundError extends NotFoundError {
    constructor(message = 'Boardgame não encontrado.') {
        super(message);
    }
}
