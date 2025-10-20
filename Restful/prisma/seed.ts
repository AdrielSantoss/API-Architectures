import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = [
        { nome: 'Alice', email: 'alice@prisma.io' },
        { nome: 'bob', email: 'bob@prisma.io' },
        { nome: 'Carlos', email: 'carlos@prisma.io' },
        { nome: 'Daniel', email: 'daniel@prisma.io' },
        { nome: 'Elena', email: 'elena@prisma.io' },
        { nome: 'Fábio', email: 'fabio@prisma.io' },
        { nome: 'Gabriela', email: 'gabriela@prisma.io' },
        { nome: 'Henrique', email: 'henrique@prisma.io' },
        { nome: 'Isabela', email: 'isabela@prisma.io' },
        { nome: 'João', email: 'joao@prisma.io' },
        { nome: 'Karina', email: 'karina@prisma.io' },
        { nome: 'Lucas', email: 'lucas@prisma.io' },
        { nome: 'Mariana', email: 'mariana@prisma.io' },
        { nome: 'Nicolas', email: 'nicolas@prisma.io' },
        { nome: 'Olivia', email: 'olivia@prisma.io' },
        { nome: 'Paulo', email: 'paulo@prisma.io' },
        { nome: 'Quintino', email: 'quintino@prisma.io' },
    ];

    for (const user of users) {
        await prisma.usuario.upsert({
            where: { email: user.email },
            update: {},
            create: user,
        });
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
