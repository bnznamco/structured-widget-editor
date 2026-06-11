<template>
  <div class="sf-field" :class="{ errors: fieldErrors.length }">
    <span class="sf-label" :class="{ required: isRequired }">
      {{ title }}
      <span v-if="isNullable && isNullValue" class="sf-null-badge">null</span>
    </span>
    <div :class="isNullable ? 'sf-input-row' : null">
      <select
        class="sf-input sf-select"
        :value="selectedIndex === -1 ? '' : String(selectedIndex)"
        @change="onChange($event.target.value)"
      >
        <option v-if="selectedIndex === -1" value="" disabled selected>{{ isNullValue ? 'null' : '' }}</option>
        <option v-for="(opt, i) in options" :key="i" :value="String(i)">
          {{ opt.label }}
        </option>
      </select>
      <button v-if="isNullable && !isNullValue" type="button" class="sf-null-clear-btn" title="Set to null" @click="$emit('update:modelValue', null)">&#x2715;</button>
    </div>
    <ul v-if="fieldErrors.length" class="errorlist">
      <li v-for="(err, i) in fieldErrors" :key="i">{{ err }}</li>
    </ul>
  </div>
</template>

<script>
import { isChoiceOneOf } from '../utils';

export default {
  name: 'SelectEditor',
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: '' },
    path: { type: Array, default: () => [] },
    form: { type: Object, default: null },
  },
  emits: ['update:modelValue'],
  computed: {
    options() {
      // Two source shapes: a choice-list oneOf ({const, title} pairs, e.g.
      // metaobjects' select kind — labels preserved) or a plain enum.
      if (isChoiceOneOf(this.schema.oneOf)) {
        return this.schema.oneOf.map((o) => ({
          value: o.const,
          label: o.title != null ? o.title : String(o.const),
        }));
      }
      return (this.schema.enum || []).map((v) => ({ value: v, label: String(v) }));
    },
    selectedIndex() {
      return this.options.findIndex((o) => o.value === this.modelValue);
    },
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
    isNullable() {
      return !!this.schema._nullable;
    },
    isNullValue() {
      return this.modelValue === null || this.modelValue === undefined;
    },
    fieldErrors() {
      if (!this.form || !this.form.getErrorsForPath) return [];
      return this.form.getErrorsForPath(this.path);
    },
  },
  methods: {
    onChange(indexStr) {
      const opt = this.options[Number(indexStr)];
      // Emit the ORIGINAL option value (options are addressed by index in
      // the DOM), so integer/boolean enums keep their native type instead
      // of being stringified by the <select> element.
      if (opt !== undefined) this.$emit('update:modelValue', opt.value);
    },
    humanize(str) {
      if (!str) return '';
      return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },
  },
};
</script>
