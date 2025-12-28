import { PrismaClient } from '@prisma/client';
import seedDatabase from '../seed.js';

const prisma = new PrismaClient();

async function main() {
    await seedDatabase(prisma);
}

main()
    .catch((e) => {
        console.error('❌ Erro ao executar seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
