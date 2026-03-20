<template>
  <div class="sf-nullable" :class="{ errors: fieldErrors.length }">
    <div class="sf-nullable-header">
      <label class="sf-label" :class="{ required: isRequired }">{{ title }}</label>
      <button type="button" :class="toggleClass" @click="toggle">
        <template v-if="isNull">
          <SfIcon name="plus" /> Add
        </template>
        <template v-else>
          <SfIcon name="times" /> Remove
        </template>
      </button>
    </div>
    <div class="sf-nullable-body">
      <SchemaEditor
        v-if="!isNull"
        :schema="innerSchema"
        :model-value="modelValue"
        :path="path"
        :form="form"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </div>
    <ul v-if="fieldErrors.length" class="errorlist">
      <li v-for="(err, i) in fieldErrors" :key="i">{{ err }}</li>
    </ul>
  </div>
</template>

<script>
import { getDefaultForSchema } from '../utils';
import SfIcon from './SfIcon.vue';

import SchemaEditor from './SchemaEditor.vue';

export default {
  name: 'NullableEditor',
  beforeCreate() {
    if (!this.$options.components) this.$options.components = {};
    this.$options.components.SchemaEditor = SchemaEditor;
    this.$options.components.SfIcon = SfIcon;
  },
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: null },
    path: { type: Array, default: () => [] },
    form: { type: Object, default: null },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      isNull: this.modelValue === null || this.modelValue === undefined,
    };
  },
  computed: {
    title() {
      return this.schema.title || this.humanize(this.path[this.path.length - 1]) || '';
    },
    isRequired() {
      if (this.path.length < 2 || !this.form) return false;
      const parentPath = this.path.slice(0, -1);
      const fieldName = this.path[this.path.length - 1];
      const parentSchema = this.form.getSchemaAtPath(parentPath);
      return parentSchema && Array.isArray(parentSchema.required) && parentSchema.required.includes(fieldName);
    },
    innerSchema() {
      const s = { ...this.schema };
      delete s._nullable;
      return s;
    },
    toggleClass() {
      return this.isNull ? 'sf-btn sf-btn-sm sf-btn-add' : 'sf-btn sf-btn-sm sf-btn-danger';
    },
    fieldErrors() {
      if (!this.form || !this.form.getErrorsForPath) return [];
      return this.form.getErrorsForPath(this.path);
    },
  },
  watch: {
    modelValue(val) {
      this.isNull = val === null || val === undefined;
    },
  },
  methods: {
    humanize(str) {
      if (!str) return '';
      return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },
    toggle() {
      if (this.isNull) {
        this.isNull = false;
        this.$emit('update:modelValue', getDefaultForSchema(this.innerSchema));
      } else {
        this.isNull = true;
        this.$emit('update:modelValue', null);
      }
    },
  },
};
</script>
