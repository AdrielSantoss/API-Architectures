import { UnathorizedError } from './main/unathorizedError';

export class InvalidApiKeyError extends UnathorizedError {
    constructor() {
        super('API key inválida.');
    }
}
