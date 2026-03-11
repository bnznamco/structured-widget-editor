import terser from '@rollup/plugin-terser';
import scss from 'rollup-plugin-scss';
import vue from 'rollup-plugin-vue';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/structured-widget-editor.esm.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/structured-widget-editor.js',
      format: 'iife',
      name: 'StructuredWidgetEditor',
      sourcemap: true,
      plugins: [terser()],
      globals: {},
    },
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      '__VUE_OPTIONS_API__': JSON.stringify(true),
      '__VUE_PROD_DEVTOOLS__': JSON.stringify(false),
      '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': JSON.stringify(false),
      preventAssignment: true,
    }),
    vue({
      css: true,
    }),
    resolve({
      extensions: ['.js', '.vue', '.json'],
    }),
    commonjs(),
    scss({
      fileName: 'structured-widget-editor.css',
      outputStyle: 'compressed',
      watch: 'src/scss',
    }),
  ],
};
