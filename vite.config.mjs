import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import vue from '@vitejs/plugin-vue';
import apiPlugin from './test/api.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Serve /dist/* files from the project root dist/ folder */
function distPlugin() {
  return {
    name: 'serve-dist',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/dist/')) {
          const filePath = resolve(__dirname, req.url.slice(1));
          if (existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/javascript');
            res.end(readFileSync(filePath));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: 'test',
  plugins: [vue(), apiPlugin(), distPlugin()],
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js',
      '@structured-field/widget-editor/scss': resolve(__dirname, 'src/scss/main.scss'),
      '@structured-field/widget-editor': resolve(__dirname, 'src/index.js'),
    },
  },
  server: {
    fs: {
      allow: [__dirname],
    },
  },
});
