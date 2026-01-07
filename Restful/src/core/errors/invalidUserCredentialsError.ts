import { UnathorizedError } from './main/unathorizedError';

export class InvalidUserCredentialsError extends UnathorizedError {
    constructor() {
        super('Email ou senha inválidos.');
    }
}
