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
        manifest: true, // <--- ВКЛЮЧАЕМ
        rollupOptions: {
            input: {
                app: path.resolve(__dirname, 'src/entries/app.jsx'),
                'public-app': path.resolve(__dirname, 'src/entries/public_app.jsx'),
            },
            output: {
                entryFileNames: '[name]-[hash].js', // <--- ХЭШ
                chunkFileNames: 'chunk-[name]-[hash].js',
                assetFileNames: '[name]-[hash].[ext]',
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react')) return 'react';
                        return 'vendor';
                    }
                    if (id.includes('/components/modals/')) return 'modals';
                },
            },
        },
        minify: true,
    },
    server: {
        port: 5173,
    },
});