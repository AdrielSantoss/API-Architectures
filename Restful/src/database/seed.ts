import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import path from 'path';

export default async function seedDatabase(prisma: PrismaClient) {
    const filePath = path.join('prisma', 'seed.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const { usuarios, boardgames } = JSON.parse(fileContent);

    console.log('👤 Inserindo usuários...');
    await prisma.usuario.createMany({ data: usuarios });

    console.log('🎲 Inserindo boardgames...');
    await prisma.boardgame.createMany({ data: boardgames });
}
