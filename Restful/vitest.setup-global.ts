import { execSync } from 'child_process';
import { prisma } from './src/core/providers/prismaClientProvider';
import seedDatabase from './src/database/seed';

export default async function () {
    console.log('🧹 Resetando banco de teste...');
    execSync(
        'npx prisma migrate reset --force --skip-seed --schema=src/database/prisma/schema.prisma',
        {
            env: {
                ...process.env,
                DATABASE_URL: process.env.DATABASE_URL_TEST,
            },
        }
    );

    console.log('🌱 Rodando seed...');
    await seedDatabase(prisma);

    await prisma.$disconnect();
}
