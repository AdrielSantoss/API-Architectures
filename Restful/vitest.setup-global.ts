import { execSync } from 'child_process';
import { prisma } from './src/database/prismaClient';
import seedDatabase from './src/database/seed';

export default async function () {
    console.log('🧹 Resetando banco de teste...');
    execSync('npx prisma migrate reset --force --skip-seed', {
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
        stdio: 'inherit',
    });

    console.log('🌱 Rodando seed...');
    await seedDatabase(prisma);

    await prisma.$disconnect();
}
