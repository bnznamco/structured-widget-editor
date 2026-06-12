import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Unit-test config — separate from vite.config.mjs, which only serves the
// manual playground in playground/ (root: 'playground') and must not affect
// unit-test runs.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Component templates are compiled by the SFC plugin; the runtime
      // build is enough and avoids the esm-bundler alias of the playground.
      '@structured-field/widget-editor': new URL('./src/index.js', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.mjs'],
    css: false,
  },
})
