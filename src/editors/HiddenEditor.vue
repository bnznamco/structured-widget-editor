<template>
  <div style="display: none"></div>
</template>

<script>
export default {
  name: 'HiddenEditor',
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: null },
    path: { type: Array, default: () => [] },
    form: { type: Object, default: null },
  },
  emits: ['update:modelValue'],
  computed: {
    resolvedValue() {
      if ('const' in this.schema) return this.schema.const;
      if (this.schema.enum && this.schema.enum.length === 1) return this.schema.enum[0];
      return this.modelValue;
    },
  },
  mounted() {
    if (this.resolvedValue !== this.modelValue) {
      this.$emit('update:modelValue', this.resolvedValue);
    }
  },
  methods: {
    getValue() {
      return this.resolvedValue;
    },
  },
};
</script>
