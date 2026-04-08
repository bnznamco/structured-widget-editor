<template>
  <WebComponentWrapper
    v-if="isWebComponent"
    ref="editor"
    :tag-name="editorComponent"
    :schema="schema"
    :model-value="modelValue"
    :path="path"
    :form="form"
    @update:model-value="$emit('update:modelValue', $event)"
  />
  <component
    v-else
    ref="editor"
    :is="editorComponent"
    :schema="schema"
    :model-value="modelValue"
    :path="path"
    :form="form"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script>
import StringEditor from './StringEditor.vue';
import NumberEditor from './NumberEditor.vue';
import BooleanEditor from './BooleanEditor.vue';
import SelectEditor from './SelectEditor.vue';
import HiddenEditor from './HiddenEditor.vue';
import ObjectEditor from './ObjectEditor.vue';
import ArrayEditor from './ArrayEditor.vue';
import NullableEditor from './NullableEditor.vue';
import UnionEditor from './UnionEditor.vue';
import RelationEditor from './RelationEditor.vue';
import JsonEditor from './JsonEditor.vue';
import WebComponentWrapper from './WebComponentWrapper.vue';

const MAX_DEPTH = 12;

export default {
  name: 'SchemaEditor',
  components: {
    StringEditor,
    NumberEditor,
    BooleanEditor,
    SelectEditor,
    HiddenEditor,
    ObjectEditor,
    ArrayEditor,
    NullableEditor,
    UnionEditor,
    RelationEditor,
    JsonEditor,
    WebComponentWrapper,
  },
  inject: {
    customEditors: { default: () => () => [] },
  },
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: undefined },
    path: { type: Array, default: () => [] },
    form: { type: Object, required: true },
  },
  emits: ['update:modelValue'],
  methods: {
    collapseAll() {
      const editor = this.$refs.editor;
      if (editor?.collapse) editor.collapse();
      if (editor?.collapseAll) editor.collapseAll();
    },
    expandAll() {
      const editor = this.$refs.editor;
      if (editor?.expand) editor.expand();
      if (editor?.expandAll) editor.expandAll();
    },
  },
  computed: {
    isWebComponent() {
      const c = this.editorComponent;
      return typeof c === 'string' && c.includes('-');
    },
    editorComponent() {
      const schema = this.schema;

      if (this.path.length > MAX_DEPTH) return 'StringEditor';

      const overrides = this.customEditors();
      for (const override of overrides) {
        if (override.match(schema, this.path)) return override.component;
      }

      if (schema.type === 'relation') return 'RelationEditor';
      if (schema.oneOf && schema.discriminator) return 'UnionEditor';
      if ('const' in schema) return 'HiddenEditor';
      if (schema.enum && schema.enum.length === 1 && schema.type === 'string') return 'HiddenEditor';
      if (schema._nullable) return 'NullableEditor';
      if (schema.type === 'object' && schema.properties) return 'ObjectEditor';
      if (schema.type === 'object') return 'JsonEditor';
      if (schema.type === 'array') return 'ArrayEditor';
      if (schema.enum) return 'SelectEditor';
      if (schema.type === 'boolean') return 'BooleanEditor';
      if (schema.type === 'number' || schema.type === 'integer') return 'NumberEditor';

      return 'StringEditor';
    },
  },
};
</script>
