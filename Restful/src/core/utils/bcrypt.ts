import bcrypt from 'bcryptjs';

export function hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 12);
}

export function comparePassword(
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}
