import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.VITEST) {
    process.env.DATABASE_URL =
        process.env.DATABASE_URL_TEST || 'file:./test.db';
}

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        globalSetup: ['./vitest.setup-global.ts'],
    },
});
