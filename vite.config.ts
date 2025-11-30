import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { PluginOption } from 'vite';
import electron from "vite-plugin-electron";

// @ts-ignore - lovable-tagger might not have types
export const componentTagger = (): PluginOption => ({
  name: 'component-tagger',
  // Add any necessary implementation here
});

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
                  entryFileNames: 'preload.cjs',
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
                fileName: () => 'preload.cjs'
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
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
      },
    },
  };
});
