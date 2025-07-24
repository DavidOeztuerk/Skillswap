// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Lade Umgebungsvariablen
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      react(),
      // Bundle-Analyse für Produktions- und Analysebuilds
      (mode === 'production' || mode === 'analyze') &&
        visualizer({
          filename: './dist/stats.html',
          open: mode === 'analyze',
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
        }),
    ],
    resolve: {
      alias: {
        // Absolute Importpfade ermöglichen
        '@': path.resolve(__dirname, './src'),
        '@api': path.resolve(__dirname, './src/api'),
        '@components': path.resolve(__dirname, './src/components'),
        '@features': path.resolve(__dirname, './src/features'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@config': path.resolve(__dirname, './src/config'),
      },
    },
    server: {
      // Entwicklungsserver-Konfiguration
      port: 3000,
      open: true,
      proxy: env.VITE_API_BASE_URL
        ? {
            // Proxy API-Anfragen im Entwicklungsmodus
            '/api': {
              target: env.VITE_API_BASE_URL,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    build: {
      // Produktionsbuild-Konfiguration
      outDir: 'dist',
      sourcemap: mode !== 'production',
      // CSS-Chunks reduzieren
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate Chunks für große Abhängigkeiten
            vendor: [
              'react',
              'react-dom',
              'react-router-dom',
              '@reduxjs/toolkit',
              'react-redux',
            ],
            mui: [
              '@mui/material',
              '@mui/icons-material',
              '@emotion/react',
              '@emotion/styled',
            ],
            webrtc: ['simple-peer', '@microsoft/signalr'],
          },
        },
      },
      // Optimierungen
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
    },
    // TypeScript-Konfiguration
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@reduxjs/toolkit',
        'react-redux',
        '@mui/material',
        '@emotion/react',
        '@emotion/styled',
        'simple-peer',
        '@microsoft/signalr',
      ],
    },
  };
});
