import './scss/main.scss';

export { default as SchemaForm } from './SchemaForm.vue';
export { default as SchemaEditor } from './editors/SchemaEditor.vue';
export { default as StringEditor } from './editors/StringEditor.vue';
export { default as NumberEditor } from './editors/NumberEditor.vue';
export { default as BooleanEditor } from './editors/BooleanEditor.vue';
export { default as SelectEditor } from './editors/SelectEditor.vue';
export { default as HiddenEditor } from './editors/HiddenEditor.vue';
export { default as ObjectEditor } from './editors/ObjectEditor.vue';
export { default as ArrayEditor } from './editors/ArrayEditor.vue';
export { default as NullableEditor } from './editors/NullableEditor.vue';
export { default as UnionEditor } from './editors/UnionEditor.vue';
export { default as RelationEditor } from './editors/RelationEditor.vue';

import { createApp, h, ref, reactive } from 'vue';
import SchemaFormComponent from './SchemaForm.vue';

export class SchemaFormElement extends HTMLElement {
  constructor() {
    super();
    this._formRef = ref(null);
    this._props = reactive({
      schema: {},
      initialData: undefined,
    });
    this._app = null;
    this._mountPoint = null;
  }

  connectedCallback() {
    this._mountPoint = document.createElement('div');
    this.appendChild(this._mountPoint);

    // Read from attributes if properties haven't been set programmatically
    if (!this._propsSet) {
      const schemaAttr = this.getAttribute('schema');
      const dataAttr = this.getAttribute('initial-data');
      if (schemaAttr) this._props.schema = JSON.parse(schemaAttr);
      if (dataAttr) this._props.initialData = JSON.parse(dataAttr);
    }

    const formRef = this._formRef;
    const props = this._props;

    this._app = createApp({
      render: () => h(SchemaFormComponent, {
        ref: formRef,
        schema: props.schema,
        initialData: props.initialData,
        onChange: (val) => {
          this.dispatchEvent(new CustomEvent('change', { detail: val, bubbles: true }));
        },
      }),
    });

    this._app.mount(this._mountPoint);
  }

  disconnectedCallback() {
    if (this._app) {
      this._app.unmount();
      this._app = null;
    }
    this._mountPoint = null;
  }

  // --- Property API ---

  get schema() {
    return this._props.schema;
  }

  set schema(val) {
    this._propsSet = true;
    this._props.schema = typeof val === 'string' ? JSON.parse(val) : val;
    this._rerender();
  }

  get initialData() {
    return this._props.initialData;
  }

  set initialData(val) {
    this._propsSet = true;
    this._props.initialData = typeof val === 'string' ? JSON.parse(val) : val;
    this._rerender();
  }

  // --- Attribute reflection ---

  static get observedAttributes() {
    return ['schema', 'initial-data'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || this._propsSet) return;
    if (name === 'schema') {
      this._props.schema = newVal ? JSON.parse(newVal) : {};
    } else if (name === 'initial-data') {
      this._props.initialData = newVal ? JSON.parse(newVal) : undefined;
    }
    this._rerender();
  }

  // --- Public methods ---

  getValue() {
    return this._formRef.value?.getValue?.() ?? null;
  }

  // --- Internal ---

  _rerender() {
    if (!this._app) return;
    this._app.unmount();
    this._mountPoint.innerHTML = '';
    const formRef = this._formRef;
    const props = this._props;

    this._app = createApp({
      render: () => h(SchemaFormComponent, {
        ref: formRef,
        schema: props.schema,
        initialData: props.initialData,
        onChange: (val) => {
          this.dispatchEvent(new CustomEvent('change', { detail: val, bubbles: true }));
        },
      }),
    });

    this._app.mount(this._mountPoint);
  }
}

export function registerCustomElement(tagName = 'schema-form') {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, SchemaFormElement);
  }
}
