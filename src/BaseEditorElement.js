/**
 * Base class for creating web component custom editors.
 *
 * Handles the property contract with the structured-widget-editor wrapper:
 * - Receives `schema`, `modelValue`, `path`, and `form` as JS properties.
 * - Provides `emitChange(value)` to dispatch the value back to the form.
 * - Provides `getErrors()` to retrieve validation errors for this field.
 * - Calls `render()` once on `connectedCallback` and `update()` on property changes.
 *
 * @example
 *   import { BaseEditorElement } from '@structured-field/widget-editor';
 *
 *   class MyColorPicker extends BaseEditorElement {
 *     render() {
 *       const input = document.createElement('input');
 *       input.type = 'color';
 *       input.value = this.modelValue || '#000000';
 *       input.addEventListener('input', () => this.emitChange(input.value));
 *       this._input = input;
 *       this.appendChild(input);
 *     }
 *
 *     update() {
 *       if (this._input) this._input.value = this.modelValue || '#000000';
 *     }
 *   }
 *
 *   customElements.define('my-color-picker', MyColorPicker);
 */
export class BaseEditorElement extends HTMLElement {
  constructor() {
    super();
    this._schema = {};
    this._modelValue = undefined;
    this._path = [];
    this._form = null;
    this._connected = false;
  }

  /* ── Property contract ─────────────────────────────────────────────── */

  get schema() { return this._schema; }
  set schema(v) {
    this._schema = v;
    if (this._connected) this.update();
  }

  get modelValue() { return this._modelValue; }
  set modelValue(v) {
    this._modelValue = v;
    if (this._connected) this.update();
  }

  get path() { return this._path; }
  set path(v) {
    this._path = v;
    if (this._connected) this.update();
  }

  get form() { return this._form; }
  set form(v) {
    this._form = v;
    if (this._connected) this.update();
  }

  /* ── Lifecycle ─────────────────────────────────────────────────────── */

  connectedCallback() {
    this._connected = true;
    this.render();
  }

  disconnectedCallback() {
    this._connected = false;
  }

  /* ── Helpers ───────────────────────────────────────────────────────── */

  /**
   * Dispatch the new value back to the form.
   * @param {*} value - The new field value.
   */
  emitChange(value) {
    this.dispatchEvent(new CustomEvent('change', { detail: value }));
  }

  /**
   * Returns the current validation errors for this field.
   * @returns {string[]}
   */
  getErrors() {
    return this._form?.getErrorsForPath?.(this._path) ?? [];
  }

  /* ── Override points ───────────────────────────────────────────────── */

  /**
   * Called once when the element is connected to the DOM.
   * Build the initial DOM structure here.
   */
  render() {}

  /**
   * Called whenever a property (schema, modelValue, path, form) changes
   * after the initial render. Update the DOM here.
   */
  update() {}
}
