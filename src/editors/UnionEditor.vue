<template>
  <div class="sf-union">
    <div class="sf-field">
      <label class="sf-label">{{ title }}</label>
      <select class="sf-input sf-select" :value="currentType" @change="onTypeChange">
        <option v-for="key in typeKeys" :key="key" :value="key">{{ humanize(key) }}</option>
      </select>
    </div>
    <div class="sf-union-body">
      <SchemaEditor
        :key="currentType"
        :schema="currentSchema"
        :model-value="innerValue"
        :path="path"
        :form="form"
        @update:model-value="onInnerChange"
      />
    </div>
  </div>
</template>

<script>
import { getDefaultForSchema } from '../utils';

import SchemaEditor from './SchemaEditor.vue';

export default {
  name: 'UnionEditor',
  beforeCreate() {
    if (!this.$options.components) this.$options.components = {};
    this.$options.components.SchemaEditor = SchemaEditor;
  },
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: null },
    path: { type: Array, default: () => [] },
    form: { type: Object, required: true },
  },
  emits: ['update:modelValue'],
  data() {
    const discriminatorProp = this.schema.discriminator.propertyName;
    const mapping = this.schema.discriminator.mapping;
    const currentType = this.modelValue ? this.modelValue[discriminatorProp] : Object.keys(mapping)[0];
    return {
      discriminatorProp,
      mapping,
      currentType,
    };
  },
  computed: {
    title() {
      return this.schema.title || this.humanize(this.path[this.path.length - 1]) || '';
    },
    typeKeys() {
      return Object.keys(this.mapping);
    },
    currentSchema() {
      const ref = this.mapping[this.currentType];
      return this.form.resolveSchema({ $ref: ref });
    },
    innerValue() {
      if (this.modelValue && this.modelValue[this.discriminatorProp] === this.currentType) {
        return this.modelValue;
      }
      const def = getDefaultForSchema(this.currentSchema);
      def[this.discriminatorProp] = this.currentType;
      return def;
    },
  },
  methods: {
    humanize(str) {
      if (!str) return '';
      return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },
    onTypeChange(e) {
      this.currentType = e.target.value;
      const def = getDefaultForSchema(this.currentSchema);
      def[this.discriminatorProp] = this.currentType;
      this.$emit('update:modelValue', def);
    },
    onInnerChange(val) {
      if (val) val[this.discriminatorProp] = this.currentType;
      this.$emit('update:modelValue', val);
    },
  },
};
</script>
