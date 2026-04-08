<template>
  <div class="sf-field" :class="{ errors: fieldErrors.length }">
    <span class="sf-label" :class="{ required: isRequired }">
      {{ title }}
      <span v-if="isNullable && isNullValue" class="sf-null-badge">null</span>
    </span>
    <div :class="isNullable ? 'sf-input-row' : null">
      <textarea
        v-if="isLong"
        class="sf-input sf-textarea"
        rows="3"
        :value="isNullValue ? '' : modelValue"
        :placeholder="isNullValue ? 'null' : (schema.placeholder || '')"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <input
        v-else
        type="text"
        class="sf-input"
        :value="isNullValue ? '' : (modelValue != null ? String(modelValue) : '')"
        :placeholder="isNullValue ? 'null' : (schema.placeholder || '')"
        @input="$emit('update:modelValue', $event.target.value)"
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
  name: 'StringEditor',
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: '' },
    path: { type: Array, default: () => [] },
    form: { type: Object, default: null },
  },
  emits: ['update:modelValue'],
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
    isLong() {
      return this.schema.maxLength > 255 || this.schema.format === 'textarea';
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
    humanize(str) {
      if (!str) return '';
      return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },
  },
};
</script>
