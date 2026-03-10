import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import apiPlugin from './test/api.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: 'test',
  plugins: [vue(), apiPlugin()],
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js',
      '@structured/widget-editor/scss': resolve(__dirname, 'src/scss/main.scss'),
      '@structured/widget-editor': resolve(__dirname, 'src/index.js'),
    },
  },
});
