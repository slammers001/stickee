import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { PluginOption } from 'vite';
import electron from "vite-plugin-electron";
import viteCompression from 'vite-plugin-compression';
import { readFileSync } from 'fs';

// @ts-ignore - lovable-tagger might not have types
export const componentTagger = (): PluginOption => ({
  name: 'component-tagger',
  // Add any necessary implementation here
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron = process.env.ELECTRON === 'true';
  
  // Read package.json for version
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
  const appVersion = packageJson.version;
  
  return {
    base: isElectron ? './' : '/',
    server: {
      host: "::",
      port: 8080,
    },
    define: {
      // Embed Supabase credentials for Electron builds
      ...(isElectron && {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      }),
      // Also embed version for web builds
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    },
    plugins: [
      react(), 
      mode === "development" && componentTagger(),
      !isElectron && viteCompression({
        algorithm: 'gzip',
        ext: '.gz'
      }),
      isElectron && electron([
        {
          entry: 'electron/main.ts',
          onstart: (options: { startup: () => void }) => {
            options.startup();
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron'],
                output: {
                  entryFileNames: 'main.js'
                }
              },
            },
          },
        },
        {
          entry: 'electron/preload.ts',
          onstart: (options: { reload: () => void }) => {
            options.reload();
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron'],
                output: {
                  entryFileNames: 'preload.js',
                  format: 'cjs',
                  inlineDynamicImports: true,
                  exports: 'auto'
                }
              },
              commonjsOptions: {
                transformMixedEsModules: true,
                esmExternals: true
              },
              // Ensure we don't have ESM-specific code in preload
              target: 'node16',
              minify: false,
              lib: {
                entry: 'electron/preload.ts',
                formats: ['cjs'],
                fileName: () => 'preload.js'
              },
              // Ensure proper module type
              ssr: true
            },
          },
        },
      ] as any) // Type assertion to handle the electron plugin type
    ].filter((p): p is Exclude<typeof p, boolean> => Boolean(p)),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: 'esbuild', // Use esbuild for faster minification
      target: 'esnext',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          // Ensure consistent file naming
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          // Manual chunking for better code splitting
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', '@radix-ui/react-label', '@radix-ui/react-slot', 'sonner'],
            router: ['react-router-dom'],
            utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
            query: ['@tanstack/react-query'],
            theme: ['next-themes'],
            icons: ['lucide-react']
          }
        },
        // External dependencies that shouldn't be bundled
        external: ['electron'],
      },
      // Enable compression
      cssCodeSplit: true,
      // Don't generate sourcemaps in production to reduce size
      sourcemap: false,
    },
  };
});
