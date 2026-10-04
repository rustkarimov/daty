import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [react()],
    build: {
        // Куда собирать: в static/js/react/ Django-проекта
        outDir: path.resolve(__dirname, '../masters/static/js/react'),
        emptyOutDir: true,
        rollupOptions: {
            input: path.resolve(__dirname, 'src/main.jsx'),
            output: {
                entryFileNames: 'dashboard.js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
            },
        },
        // Не минифицируем на этапе разработки — легче дебажить
        minify: false,
    },
    server: {
        port: 5173,
    },
});