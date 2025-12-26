import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { PluginOption } from 'vite';
import viteCompression from 'vite-plugin-compression';
import { readFileSync } from 'fs';
import { copyFileSync, existsSync } from 'fs';

// Tree shaking plugin for lucide-react
const lucideTreeShake = (): PluginOption => ({
  name: 'lucide-tree-shake',
  resolveId(id) {
    if (id === 'lucide-react') {
      return id;
    }
  },
  load(id) {
    if (id === 'lucide-react') {
      return `export * from 'lucide-react/dist/esm/icons/index.js';`;
    }
  }
});

// @ts-ignore - lovable-tagger might not have types
export const componentTagger = (): PluginOption => ({
  name: 'component-tagger',
  // Add any necessary implementation here
});

// Plugin to copy TERMS_OF_SERVICE.md to build output
const copyTermsFile = (): PluginOption => ({
  name: 'copy-terms-file',
  writeBundle() {
    if (existsSync('./TERMS_OF_SERVICE.md')) {
      copyFileSync('./TERMS_OF_SERVICE.md', './dist/TERMS_OF_SERVICE.md');
      copyFileSync('./TERMS_OF_SERVICE.md', './public/TERMS_OF_SERVICE.md');
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env.local
  const env = loadEnv(mode, process.cwd(), '');
  
  // Read package.json for version
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
  const appVersion = packageJson.version;
  
  return {
    base: './',
    server: {
      host: "::",
      port: 8080,
    },
    define: {
      // Embed Supabase credentials for all builds
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    },
    plugins: [
      react(), 
      mode === "development" && componentTagger(),
      lucideTreeShake(),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz'
      }),
      copyTermsFile(), // Always copy terms file
    ].filter((p): p is Exclude<typeof p, boolean> => Boolean(p)),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: 'esbuild',
      target: 'esnext',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
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
        external: [],
        treeshake: 'smallest'
      },
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096
    },
  };
});
