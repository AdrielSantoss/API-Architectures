import { Worker, Job } from 'bullmq';
import { BoardgameDto } from '../../api/models/boardgameDto';
import { bullRedisOptions } from '../../database/redisConnections';
import { Boardgame } from '@prisma/client';
import { prisma } from '../../database/prismaClient';

interface CreateBoardgamesJob {
    boardgames: BoardgameDto[];
    usuarioId: number;
}

export const boardgameWorker = new Worker(
    'boardgame-queue',
    async (job: Job<CreateBoardgamesJob>) => {
        if (job.name === 'create-boardgames') {
            const { boardgames, usuarioId } = job.data;

            let boardgamesModel: Boardgame[] = [];

            for (const newBoardgame of boardgames) {
                boardgamesModel.push(<Boardgame>{
                    nome: newBoardgame.nome,
                    descricao: newBoardgame.descricao,
                    complexidade: newBoardgame.complexidade,
                    ano: newBoardgame.ano ?? 0,
                    idade: newBoardgame.idade,
                    tempo: newBoardgame.tempo,
                    usuarioId: usuarioId,
                });
            }

            prisma.boardgame.createMany({
                data: boardgamesModel,
            });
        }
    },
    {
        connection: bullRedisOptions,
        concurrency: 5,
    }
);
