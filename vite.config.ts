import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { PluginOption } from 'vite';
import electron from "vite-plugin-electron";
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

export const componentTagger = (): PluginOption => {
  return {
    name: 'component-tagger',
    // Add any necessary implementation here
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron = process.env.ELECTRON === 'true';
  
  return {
    base: isElectron ? './' : '/',
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(), 
      mode === "development" && componentTagger(),
      !isElectron && VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Stickee',
          short_name: 'Stickee',
          description: 'Create and organize your thoughts with beautiful digital sticky notes',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/favicons/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/favicons/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),
      !isElectron && viteCompression({
        algorithm: 'gzip',
        ext: '.gz'
      }),
      // @ts-expect-error - electron plugin type compatibility
      isElectron && (electron([
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
      ] as unknown as PluginOption) as PluginOption)
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
