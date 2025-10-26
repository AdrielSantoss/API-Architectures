import { ConflictError } from './conflictError';

export class DuplicateUserError extends ConflictError {
    constructor() {
        super('Usuário já está cadastrado.');
    }
}
