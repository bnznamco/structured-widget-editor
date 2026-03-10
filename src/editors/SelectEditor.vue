<template>
  <div class="sf-field">
    <label class="sf-label" :class="{ required: isRequired }">{{ title }}</label>
    <select
      class="sf-input sf-select"
      :value="modelValue != null ? String(modelValue) : ''"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-for="opt in (schema.enum || [])" :key="opt" :value="String(opt)">
        {{ opt }}
      </option>
    </select>
  </div>
</template>

<script>
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
  },
  methods: {
    humanize(str) {
      if (!str) return '';
      return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },
  },
};
</script>
