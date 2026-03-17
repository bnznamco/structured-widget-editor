<template>
  <div v-if="isRoot" class="sf-object sf-object-root">
    <div class="sf-object-fields">
      <SchemaEditor
        v-for="(propSchema, key) in (schema.properties || {})"
        :key="key"
        :schema="form.resolveSchema(propSchema)"
        :model-value="(modelValue || {})[key]"
        :path="[...path, key]"
        :form="form"
        @update:model-value="onChildChange(key, $event)"
      />
    </div>
  </div>
  <fieldset v-else class="sf-object">
    <legend class="sf-object-title">{{ title }}</legend>
    <div class="sf-object-fields">
      <SchemaEditor
        v-for="(propSchema, key) in (schema.properties || {})"
        :key="key"
        :schema="form.resolveSchema(propSchema)"
        :model-value="(modelValue || {})[key]"
        :path="[...path, key]"
        :form="form"
        @update:model-value="onChildChange(key, $event)"
      />
    </div>
  </fieldset>
</template>

<script>
import SchemaEditor from './SchemaEditor.vue';

export default {
  name: 'ObjectEditor',
  beforeCreate() {
    if (!this.$options.components) this.$options.components = {};
    this.$options.components.SchemaEditor = SchemaEditor;
  },
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: () => ({}) },
    path: { type: Array, default: () => [] },
    form: { type: Object, required: true },
  },
  emits: ['update:modelValue'],
  computed: {
    isRoot() {
      return this.path.length === 0;
    },
    title() {
      return this.schema.title || this.humanize(this.path[this.path.length - 1]) || '';
    },
  },
  methods: {
    humanize(str) {
      if (!str) return '';
      return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },
    onChildChange(key, value) {
      const newVal = { ...(this.modelValue || {}), [key]: value };
      this.$emit('update:modelValue', newVal);
    },
  },
};
</script>
