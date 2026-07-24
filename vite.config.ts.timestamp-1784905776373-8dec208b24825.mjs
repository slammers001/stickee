// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/sjs/Desktop/stickee/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/sjs/Desktop/stickee/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import viteCompression from "file:///C:/Users/sjs/Desktop/stickee/node_modules/vite-plugin-compression/dist/index.mjs";
import { readFileSync } from "fs";
import { copyFileSync, existsSync } from "fs";
var __vite_injected_original_dirname = "C:\\Users\\sjs\\Desktop\\stickee";
var copyTermsFile = () => ({
  name: "copy-terms-file",
  writeBundle() {
    if (existsSync("./TERMS_OF_SERVICE.md")) {
      copyFileSync("./TERMS_OF_SERVICE.md", "./dist/TERMS_OF_SERVICE.md");
      copyFileSync("./TERMS_OF_SERVICE.md", "./public/TERMS_OF_SERVICE.md");
    }
  }
});
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
  const appVersion = packageJson.version;
  return {
    base: "./",
    server: {
      host: "::",
      port: 8080
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL || ""),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion)
    },
    plugins: [
      react(),
      viteCompression({
        algorithm: "gzip",
        ext: ".gz"
      }),
      copyTermsFile()
    ].filter((p) => Boolean(p)),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      minify: "esbuild",
      target: "esnext",
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]"
        }
      },
      cssCodeSplit: true,
      sourcemap: false
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzanNcXFxcRGVza3RvcFxcXFxzdGlja2VlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzanNcXFxcRGVza3RvcFxcXFxzdGlja2VlXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9zanMvRGVza3RvcC9zdGlja2VlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHR5cGUgeyBQbHVnaW5PcHRpb24gfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHZpdGVDb21wcmVzc2lvbiBmcm9tICd2aXRlLXBsdWdpbi1jb21wcmVzc2lvbic7XHJcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcclxuaW1wb3J0IHsgY29weUZpbGVTeW5jLCBleGlzdHNTeW5jIH0gZnJvbSAnZnMnO1xyXG5cclxuLy8gVHJlZSBzaGFraW5nIHBsdWdpbiBmb3IgbHVjaWRlLXJlYWN0XHJcbmNvbnN0IGx1Y2lkZVRyZWVTaGFrZSA9ICgpOiBQbHVnaW5PcHRpb24gPT4gKHtcclxuICBuYW1lOiAnbHVjaWRlLXRyZWUtc2hha2UnLFxyXG4gIHJlc29sdmVJZChpZCkge1xyXG4gICAgaWYgKGlkID09PSAnbHVjaWRlLXJlYWN0Jykge1xyXG4gICAgICByZXR1cm4gaWQ7XHJcbiAgICB9XHJcbiAgfSxcclxuICBsb2FkKGlkKSB7XHJcbiAgICBpZiAoaWQgPT09ICdsdWNpZGUtcmVhY3QnKSB7XHJcbiAgICAgIHJldHVybiBgZXhwb3J0ICogZnJvbSAnbHVjaWRlLXJlYWN0L2Rpc3QvZXNtL2ljb25zL2luZGV4LmpzJztgO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcblxyXG5cclxuLy8gUGx1Z2luIHRvIGNvcHkgVEVSTVNfT0ZfU0VSVklDRS5tZCB0byBidWlsZCBvdXRwdXRcclxuY29uc3QgY29weVRlcm1zRmlsZSA9ICgpOiBQbHVnaW5PcHRpb24gPT4gKHtcclxuICBuYW1lOiAnY29weS10ZXJtcy1maWxlJyxcclxuICB3cml0ZUJ1bmRsZSgpIHtcclxuICAgIGlmIChleGlzdHNTeW5jKCcuL1RFUk1TX09GX1NFUlZJQ0UubWQnKSkge1xyXG4gICAgICBjb3B5RmlsZVN5bmMoJy4vVEVSTVNfT0ZfU0VSVklDRS5tZCcsICcuL2Rpc3QvVEVSTVNfT0ZfU0VSVklDRS5tZCcpO1xyXG4gICAgICBjb3B5RmlsZVN5bmMoJy4vVEVSTVNfT0ZfU0VSVklDRS5tZCcsICcuL3B1YmxpYy9URVJNU19PRl9TRVJWSUNFLm1kJyk7XHJcbiAgICB9XHJcbiAgfSxcclxufSk7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgLy8gTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZnJvbSAuZW52LmxvY2FsXHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XHJcbiAgXHJcbiAgLy8gUmVhZCBwYWNrYWdlLmpzb24gZm9yIHZlcnNpb25cclxuICBjb25zdCBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKCcuL3BhY2thZ2UuanNvbicsICd1dGYtOCcpKTtcclxuICBjb25zdCBhcHBWZXJzaW9uID0gcGFja2FnZUpzb24udmVyc2lvbjtcclxuICBcclxuICByZXR1cm4ge1xyXG4gICAgYmFzZTogJy4vJyxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiBcIjo6XCIsXHJcbiAgICAgIHBvcnQ6IDgwODAsXHJcbiAgICB9LFxyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9TVVBBQkFTRV9VUkwnOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9TVVBBQkFTRV9VUkwgfHwgJycpLFxyXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVknOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCAnJyksXHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9BUFBfVkVSU0lPTic6IEpTT04uc3RyaW5naWZ5KGFwcFZlcnNpb24pLFxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKSwgXHJcbiAgICAgIHZpdGVDb21wcmVzc2lvbih7XHJcbiAgICAgICAgYWxnb3JpdGhtOiAnZ3ppcCcsXHJcbiAgICAgICAgZXh0OiAnLmd6J1xyXG4gICAgICB9KSxcclxuICAgICAgY29weVRlcm1zRmlsZSgpLFxyXG4gICAgXS5maWx0ZXIoKHApOiBwIGlzIEV4Y2x1ZGU8dHlwZW9mIHAsIGJvb2xlYW4+ID0+IEJvb2xlYW4ocCkpLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxyXG4gICAgICBlbXB0eU91dERpcjogdHJ1ZSxcclxuICAgICAgbWluaWZ5OiAnZXNidWlsZCcsXHJcbiAgICAgIHRhcmdldDogJ2VzbmV4dCcsXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXHJcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJ1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gICAgICBzb3VyY2VtYXA6IGZhbHNlXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdSLFNBQVMsY0FBYyxlQUFlO0FBQ3RULE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFFakIsT0FBTyxxQkFBcUI7QUFDNUIsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxjQUFjLGtCQUFrQjtBQU56QyxJQUFNLG1DQUFtQztBQXlCekMsSUFBTSxnQkFBZ0IsT0FBcUI7QUFBQSxFQUN6QyxNQUFNO0FBQUEsRUFDTixjQUFjO0FBQ1osUUFBSSxXQUFXLHVCQUF1QixHQUFHO0FBQ3ZDLG1CQUFhLHlCQUF5Qiw0QkFBNEI7QUFDbEUsbUJBQWEseUJBQXlCLDhCQUE4QjtBQUFBLElBQ3RFO0FBQUEsRUFDRjtBQUNGO0FBR0EsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFFeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRzNDLFFBQU0sY0FBYyxLQUFLLE1BQU0sYUFBYSxrQkFBa0IsT0FBTyxDQUFDO0FBQ3RFLFFBQU0sYUFBYSxZQUFZO0FBRS9CLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixxQ0FBcUMsS0FBSyxVQUFVLElBQUkscUJBQXFCLEVBQUU7QUFBQSxNQUMvRSwwQ0FBMEMsS0FBSyxVQUFVLElBQUksMEJBQTBCLEVBQUU7QUFBQSxNQUN6RixvQ0FBb0MsS0FBSyxVQUFVLFVBQVU7QUFBQSxJQUMvRDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sZ0JBQWdCO0FBQUEsUUFDZCxXQUFXO0FBQUEsUUFDWCxLQUFLO0FBQUEsTUFDUCxDQUFDO0FBQUEsTUFDRCxjQUFjO0FBQUEsSUFDaEIsRUFBRSxPQUFPLENBQUMsTUFBdUMsUUFBUSxDQUFDLENBQUM7QUFBQSxJQUMzRCxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixhQUFhO0FBQUEsTUFDYixRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLGNBQWM7QUFBQSxNQUNkLFdBQVc7QUFBQSxJQUNiO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
