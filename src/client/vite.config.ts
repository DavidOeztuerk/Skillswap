import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  // const isProduction = mode === 'production';
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      react({
        jsxImportSource: 'react',
        plugins: [],
      }),
      isAnalyze &&
        visualizer({
          filename: './dist/bundle-analysis.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
        }),
    ].filter(Boolean),
    worker: {
      format: 'es',
      plugins: () => [react()],
    },
    resolve: {
      alias: {},
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },

    server: {
      port: 3000,
      open: true,
      cors: true,
      host: true,
      proxy: env.VITE_API_BASE_URL
        ? {
            '/api': {
              target: env.VITE_API_BASE_URL,
              changeOrigin: true,
              secure: false,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
            '/socket': {
              target: env.VITE_API_BASE_URL,
              changeOrigin: true,
              ws: true,
            },
          }
        : undefined,
    },

    // build: {
    //   outDir: 'dist',
    //   sourcemap: !isProduction,
    //   target: 'es2022',
    //   cssTarget: 'es2022',
    //   rollupOptions: {
    //     output: {
    //       manualChunks: (id) => {
    //         // Dynamisches Chunking basierend auf Pfaden
    //         if (id.includes('node_modules')) {
    //           if (id.includes('react')) return 'vendor-react';
    //           if (id.includes('@mui')) return 'vendor-mui';
    //           if (id.includes('redux')) return 'vendor-state';
    //           if (id.includes('simple-peer') || id.includes('signalr')) return 'vendor-webrtc';
    //           return 'vendor-other';
    //         }

    //         // Feature-based Chunks
    //         if (id.includes('/features/')) {
    //           const match = id.match(/\/features\/([^\/]+)/);
    //           return match ? `feature-${match[1]}` : null;
    //         }
    //       },

    //       // Bessere Dateinamen
    //       entryFileNames: 'assets/[name]-[hash].js',
    //       chunkFileNames: 'assets/[name]-[hash].js',
    //       assetFileNames: 'assets/[name]-[hash].[ext]',
    //     },
    //   },

    //   // Optimierungen
    //   minify: isProduction ? 'terser' : false,
    //   terserOptions: isProduction
    //     ? {
    //         compress: {
    //           drop_console: true,
    //           drop_debugger: true,
    //           pure_funcs: ['console.debug'], // ← Nur debug entfernen
    //         },
    //       }
    //     : undefined,

    //   // Performance
    //   reportCompressedSize: true,
    //   chunkSizeWarningLimit: 1000, // ← Erhöht für größere Bundles
    // },

    // Optimize Dependencies

    build: {
      // Warning-Limit erhöhen
      chunkSizeWarningLimit: 1500,
      // Rollup automatisch optimieren lassen (keine manualChunks - verhindert zirkuläre Abhängigkeiten)
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
      ],
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', 'simple-peer', '@microsoft/signalr'],
    },

    // Experimentelle Features
    experimental: {
      renderBuiltUrl(filename: string) {
        // CDN Support
        if (env.VITE_CDN_URL) {
          return `${env.VITE_CDN_URL}/${filename}`;
        }
        return { relative: true };
      },
    },
  };
});
