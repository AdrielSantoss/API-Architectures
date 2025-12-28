import { ConflictError } from './main/conflictError';

export class DuplicateBoardgameError extends ConflictError {
    constructor() {
        super('Boardgame já está cadastrado.');
    }
}
