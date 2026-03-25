# @structured-field/widget-editor

A Vue-powered JSON Schema form builder with first-class support for relation fields (ForeignKey, QuerySet) and autocomplete search. Ships as both Vue components and a Web Component custom element.

Built for the [django-structured-json-field](https://github.com/bnznamco/django-structured-field) admin widget, but usable standalone with any JSON Schema + REST search endpoint.

## Features

- **JSON Schema driven** — renders forms from standard JSON Schema (`$ref`, `$defs`, `anyOf`, `oneOf`, `discriminator`)
- **Relation fields** — ForeignKey (single) and QuerySet (multi) with AJAX autocomplete from a search endpoint
- **Discriminated unions** — type selector that swaps sub-forms based on a discriminator property
- **Nullable fields** — togglable Add/Remove for optional nested objects
- **Array fields** — ordered list with add, remove, and reorder controls
- **Built with Vue 3** — internally uses Vue SFC components, exported as a Web Component custom element
- **Theme integration** — styles via CSS custom properties (ships with Django admin compatibility)

## Installation

```bash
npm install @structured-field/widget-editor
# or
pnpm add @structured-field/widget-editor
```

## Usage

### Web Component (custom element)

Register the `<schema-form>` custom element, then use it in any HTML page or framework:

```js
import { registerCustomElement } from '@structured-field/widget-editor';
import '@structured-field/widget-editor/css';

registerCustomElement(); // registers <schema-form>
```

#### Programmatic initialization (recommended)

```js
const el = document.createElement('schema-form');

el.schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' },
  },
};

el.initialData = { name: 'Ada', age: 36 };

el.addEventListener('change', (e) => {
  console.log('Form value:', e.detail);
});

document.getElementById('my-form').appendChild(el);

// Get current value at any time
const value = el.getValue();
```

#### Declarative HTML

```html
<schema-form
  schema='{"type":"object","properties":{"name":{"type":"string"}}}'
  initial-data='{"name":"Ada"}'
></schema-form>

<script>
  document.querySelector('schema-form').addEventListener('change', (e) => {
    console.log(e.detail);
  });
</script>
```

### As a Vue component

Import `SchemaForm` directly for use inside Vue applications:

```vue
<template>
  <SchemaForm :schema="schema" :initial-data="data" @change="onFormChange" />
</template>

<script setup>
import { SchemaForm } from '@structured-field/widget-editor';
import '@structured-field/widget-editor/css';

const schema = { /* JSON Schema */ };
const data = { /* initial form data */ };

function onFormChange(value) {
  console.log('Form value:', value);
}
</script>
```

### As an IIFE (script tag)

#### All-in-one bundle (recommended)

A single `<script>` tag that includes both JS and CSS — no separate stylesheet needed:

```html
<!-- Latest version -->
<script src="https://bnznamco.github.io/structured-widget-editor/latest/structured-widget-editor.iife.js"></script>

<!-- Pinned version -->
<script src="https://bnznamco.github.io/structured-widget-editor/v1.0.0/structured-widget-editor.iife.js"></script>
```

#### Separate JS + CSS

```html
<!-- Latest version -->
<link rel="stylesheet" href="https://bnznamco.github.io/structured-widget-editor/latest/structured-widget-editor.css">
<script src="https://bnznamco.github.io/structured-widget-editor/latest/structured-widget-editor.js"></script>

<!-- Pinned version -->
<link rel="stylesheet" href="https://bnznamco.github.io/structured-widget-editor/v1.0.0/structured-widget-editor.css">
<script src="https://bnznamco.github.io/structured-widget-editor/v1.0.0/structured-widget-editor.js"></script>
```

#### Via jsDelivr (from npm)

```html
<script src="https://cdn.jsdelivr.net/npm/@structured-field/widget-editor@latest/dist/structured-widget-editor.iife.js"></script>
<!-- or pinned -->
<script src="https://cdn.jsdelivr.net/npm/@structured-field/widget-editor@1.0.0/dist/structured-widget-editor.iife.js"></script>
```

#### Usage

```html
<script src="https://bnznamco.github.io/structured-widget-editor/latest/structured-widget-editor.iife.js"></script>
<script>
  StructuredWidgetEditor.registerCustomElement();

  const el = document.createElement('schema-form');
  el.schema = { /* JSON Schema */ };
  el.initialData = { /* data */ };
  el.addEventListener('change', (e) => console.log(e.detail));
  document.getElementById('my-form').appendChild(el);
</script>
```

## Relation Fields

The editor supports a custom `type: "relation"` schema extension for ForeignKey and QuerySet fields:

```json
{
  "type": "relation",
  "format": "select2",
  "model": "app.ModelName",
  "multiple": false,
  "options": {
    "select2": {
      "placeholder": "Search...",
      "allowClear": true,
      "ajax": {
        "url": "/api/search/app.ModelName/"
      }
    }
  }
}
```

The search endpoint should return:

```json
{
  "items": [
    { "id": 1, "name": "Item 1", "model": "app.modelname" },
    { "id": 2, "name": "Item 2", "model": "app.modelname" }
  ],
  "more": false
}
```

Query parameters sent: `_q` (search term), `page` (pagination).

## Editors

| Schema type | Editor | Description |
|---|---|---|
| `string` | StringEditor | Text input or textarea |
| `integer` / `number` | NumberEditor | Number input with step |
| `boolean` | BooleanEditor | Checkbox |
| `enum` | SelectEditor | Dropdown select |
| `const` | HiddenEditor | Hidden (not rendered) |
| `object` | ObjectEditor | Nested fieldset |
| `array` | ArrayEditor | List with add/remove/reorder |
| `anyOf [T, null]` | NullableEditor | Togglable wrapper |
| `oneOf + discriminator` | UnionEditor | Type selector |
| `relation` | RelationEditor | Autocomplete with search |

## Custom Editors

You can override the editor used for any field by passing a `customEditors` array to `SchemaForm`. Each entry defines a `match` condition and the `component` to render when that condition is true. Overrides are evaluated **before** the built-in resolution logic, in order — the first match wins.

### Vue component

```vue
<template>
  <SchemaForm :schema="schema" :custom-editors="customEditors" />
</template>

<script setup>
import { SchemaForm } from '@structured-field/widget-editor';
import MyDatePicker from './MyDatePicker.vue';
import MyColorPicker from './MyColorPicker.vue';

const customEditors = [
  // Match by schema format
  { match: (schema) => schema.format === 'date', component: MyDatePicker },
  // Match by field name (last segment of the path)
  { match: (schema, path) => path.at(-1) === 'color', component: MyColorPicker },
  // Match by a custom schema property
  { match: (schema) => schema['x-widget'] === 'rich-text', component: MyRichText },
];
</script>
```

### Web Component

```js
const el = document.querySelector('schema-form');

el.customEditors = [
  { match: (schema) => schema.format === 'date', component: MyDatePicker },
];
```

### Custom editor API

A custom editor component must accept the following props and emit `update:modelValue` to write values back. **Never mutate `modelValue` directly.**

| Prop | Type | Description |
|---|---|---|
| `schema` | `Object` | The resolved JSON Schema for this field |
| `modelValue` | `any` | Current field value — read-only |
| `path` | `string[]` | Path segments from the root (`['address', 'city']`) |
| `form` | `Object` | Form API: `getSchemaAtPath(path)`, `getErrorsForPath(path)`, `resolveSchema(schema)` |

| Emit | Payload | Description |
|---|---|---|
| `update:modelValue` | new value | The only way to write a value back to the form |

### Starter template

Copy and adapt this component as a starting point:

```vue
<template>
  <div class="sf-field" :class="{ errors: fieldErrors.length }">
    <label class="sf-label" :class="{ required: isRequired }">{{ title }}</label>

    <!-- Replace this with your custom input -->
    <input
      type="text"
      class="sf-input"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />

    <ul v-if="fieldErrors.length" class="errorlist">
      <li v-for="(err, i) in fieldErrors" :key="i">{{ err }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'MyCustomEditor',
  props: {
    schema:     { type: Object, required: true },
    modelValue: { default: undefined },
    path:       { type: Array,  default: () => [] },
    form:       { type: Object, default: null },
  },
  emits: ['update:modelValue'],
  computed: {
    title() {
      return this.schema.title || this.humanize(this.path.at(-1)) || '';
    },
    isRequired() {
      if (this.path.length < 2 || !this.form) return false;
      const parentSchema = this.form.getSchemaAtPath(this.path.slice(0, -1));
      return Array.isArray(parentSchema?.required) && parentSchema.required.includes(this.path.at(-1));
    },
    fieldErrors() {
      return this.form?.getErrorsForPath?.(this.path) ?? [];
    },
  },
  methods: {
    humanize(str) {
      if (!str) return '';
      return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },
  },
};
</script>
```

## Theming

All styles use CSS custom properties with sensible defaults. Override them to match your design system:

```css
:root {
  --body-bg: #fff;
  --body-fg: #333;
  --border-color: #ccc;
  --primary: #79aec8;
  --error-fg: #ba2121;
  --darkened-bg: #f0f0f0;
  --object-tools-bg: #888;
  --object-tools-fg: #fff;
  /* ... */
}
```

## Development

```bash
pnpm install
pnpm run dev    # watch mode
pnpm run build  # production build
```

## License

MIT
