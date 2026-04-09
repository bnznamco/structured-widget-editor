<template>
  <div class="sf-field" :class="{ errors: fieldErrors.length }">
    <span class="sf-label" :class="{ required: isRequired }">
      {{ title }}
      <span v-if="isNullable && isNullValue" class="sf-null-badge">null</span>
    </span>
    <div :class="isNullable ? 'sf-input-row' : null">
      <input
        :type="inputType"
        class="sf-input"
        :value="displayValue"
        :placeholder="isNullValue ? 'null' : (schema.placeholder || '')"
        :min="schema.minimum || schema.formatMinimum || null"
        :max="schema.maximum || schema.formatMaximum || null"
        @input="onInput"
      />
      <button v-if="isNullable && !isNullValue" type="button" class="sf-null-clear-btn" title="Set to null" @click="$emit('update:modelValue', null)">&#x2715;</button>
    </div>
    <ul v-if="fieldErrors.length" class="errorlist">
      <li v-for="(err, i) in fieldErrors" :key="i">{{ err }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'DateEditor',
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: '' },
    path: { type: Array, default: () => [] },
    form: { type: Object, default: null },
  },
  emits: ['update:modelValue'],
  computed: {
    isDateTime() {
      return this.schema.format === 'date-time';
    },
    inputType() {
      return this.isDateTime ? 'datetime-local' : 'date';
    },
    displayValue() {
      if (this.isNullValue) return '';
      const v = String(this.modelValue);
      if (this.isDateTime) {
        // Accept ISO 8601 strings like "2026-04-09T10:30:00[.sss][Z|+00:00]"
        // datetime-local expects "YYYY-MM-DDTHH:mm" (or with seconds).
        const match = v.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}(?:\.\d+)?))?/);
        if (match) {
          return match[3] ? `${match[1]}T${match[2]}:${match[3]}` : `${match[1]}T${match[2]}`;
        }
        return v;
      }
      // date: expect "YYYY-MM-DD"
      return v.slice(0, 10);
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
    onInput(e) {
      const val = e.target.value;
      if (val === '') {
        this.$emit('update:modelValue', this.isNullable ? null : '');
        return;
      }
      // Emit ISO-compatible string. Pydantic accepts both "YYYY-MM-DD"
      // and "YYYY-MM-DDTHH:mm[:ss]" for date / datetime fields.
      this.$emit('update:modelValue', val);
    },
    humanize(str) {
      if (!str) return '';
      return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },
  },
};
</script>
