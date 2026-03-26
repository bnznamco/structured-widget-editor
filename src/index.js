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
export { default as WebComponentWrapper } from './editors/WebComponentWrapper.vue';

import { defineCustomElement } from 'vue';
import SchemaFormComponent from './SchemaForm.vue';

export const SchemaFormElement = defineCustomElement({
  ...SchemaFormComponent,
  shadowRoot: false,
});

export function registerCustomElement(tagName = 'schema-form') {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, SchemaFormElement);
  }
}
