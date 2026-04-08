<template>
  <div class="sf-field sf-field-boolean" :class="{ errors: fieldErrors.length }">
    <div class="sf-boolean-row">
      <label class="sf-checkbox-label">
        <input
          type="checkbox"
          class="sf-checkbox"
          :checked="!!modelValue"
          @change="$emit('update:modelValue', $event.target.checked)"
        />
        {{ title }}
        <span v-if="isNullable && isNullValue" class="sf-null-badge">null</span>
      </label>
      <button v-if="isNullable && !isNullValue" type="button" class="sf-null-clear-btn" title="Set to null" @click="$emit('update:modelValue', null)">&#x2715;</button>
    </div>
    <ul v-if="fieldErrors.length" class="errorlist">
      <li v-for="(err, i) in fieldErrors" :key="i">{{ err }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'BooleanEditor',
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: false },
    path: { type: Array, default: () => [] },
    form: { type: Object, default: null },
  },
  emits: ['update:modelValue'],
  computed: {
    title() {
      return this.schema.title || this.humanize(this.path[this.path.length - 1]) || '';
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
