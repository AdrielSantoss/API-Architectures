// src/infra/workers/boardgame.worker.ts
import { Worker, Job } from 'bullmq';
import { BoardgameDto } from '../models/boardgameDto';
import { bullRedisOptions } from '../database/redisConnections';

interface CreateBoardgamesJob {
    boardgames: BoardgameDto[];
    usuarioId: number;
}

export const boardgameWorker = new Worker(
    'boardgame-queue',
    async (job: Job<CreateBoardgamesJob>) => {
        if (job.name === 'create-boardgames') {
            const { boardgames, usuarioId } = job.data;

            console.log('Processando job:', job.id);
            console.log('Usuário:', usuarioId);
            console.log('Qtd boardgames:', boardgames.length);
        }
    },
    {
        connection: bullRedisOptions,
        concurrency: 5,
    }
);
