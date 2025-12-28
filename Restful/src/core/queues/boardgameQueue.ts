import { Queue } from 'bullmq';

export const boardgameQueue = new Queue('boardgame-queue');
