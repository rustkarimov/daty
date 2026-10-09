import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: path.resolve(__dirname, '../masters/static/js/react'),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                dashboard: path.resolve(__dirname, 'src/entries/dashboard.jsx'),
                services: path.resolve(__dirname, 'src/entries/services.jsx'),
                schedule: path.resolve(__dirname, 'src/entries/schedule.jsx'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: 'chunk-[name].js',
                assetFileNames: '[name].[ext]',
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react')) return 'react';
                        return 'vendor';
                    }
                    if (id.includes('/components/modals/')) return 'modals';
                },
            },
        },
        minify: false,
    },
    server: {
        port: 5173,
    },
});