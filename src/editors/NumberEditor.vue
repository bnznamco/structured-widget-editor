<template>
  <div class="sf-field" :class="{ errors: fieldErrors.length }">
    <span class="sf-label" :class="{ required: isRequired }">{{ title }}</span>
    <input
      type="number"
      class="sf-input"
      :step="schema.type === 'integer' ? '1' : 'any'"
      :min="schema.minimum != null ? String(schema.minimum) : undefined"
      :max="schema.maximum != null ? String(schema.maximum) : undefined"
      :value="modelValue != null ? modelValue : ''"
      @input="onInput"
    />
    <ul v-if="fieldErrors.length" class="errorlist">
      <li v-for="(err, i) in fieldErrors" :key="i">{{ err }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'NumberEditor',
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: 0 },
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
    onInput(e) {
      const raw = e.target.value;
      if (raw === '') {
        this.$emit('update:modelValue', 0);
      } else {
        this.$emit('update:modelValue', this.schema.type === 'integer' ? parseInt(raw, 10) : parseFloat(raw));
      }
    },
  },
};
</script>
