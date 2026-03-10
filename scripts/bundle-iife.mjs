/**
 * Creates a self-contained IIFE bundle that injects the CSS via a <style> tag
 * so consumers only need a single <script> tag.
 *
 * Input:  dist/structured-widget-editor.js  +  dist/structured-widget-editor.css
 * Output: dist/structured-widget-editor.iife.js
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, '..', 'dist');

const css = readFileSync(resolve(dist, 'structured-widget-editor.css'), 'utf8');
const js = readFileSync(resolve(dist, 'structured-widget-editor.js'), 'utf8');

const banner = `/* @structured-field/widget-editor – IIFE bundle with embedded CSS */\n`;
const cssInjector = `(function(){var s=document.createElement("style");s.textContent=${JSON.stringify(css)};document.head.appendChild(s)})();\n`;

writeFileSync(resolve(dist, 'structured-widget-editor.iife.js'), banner + cssInjector + js);

console.log('✓ dist/structured-widget-editor.iife.js created (IIFE + CSS)');
