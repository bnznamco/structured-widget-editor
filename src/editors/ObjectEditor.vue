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
  <fieldset v-else class="sf-object" :class="{ 'sf-object-collapsed': collapsed }">
    <legend class="sf-object-title">
      <button type="button" class="sf-collapse-btn" :aria-label="collapsed ? 'Expand' : 'Collapse'" @click="collapsed = !collapsed">
        <SfIcon :name="collapsed ? 'chevron-down' : 'chevron-up'" :size="12" />
      </button>
      <span class="sf-object-title-text">{{ title }}</span>
      <span v-if="collapsed && summary" class="sf-object-summary">{{ summary }}</span>
    </legend>
    <div v-show="!collapsed" class="sf-object-fields">
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
import SfIcon from './SfIcon.vue';

export default {
  name: 'ObjectEditor',
  beforeCreate() {
    if (!this.$options.components) this.$options.components = {};
    this.$options.components.SchemaEditor = SchemaEditor;
    this.$options.components.SfIcon = SfIcon;
  },
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: () => ({}) },
    path: { type: Array, default: () => [] },
    form: { type: Object, required: true },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      collapsed: false,
    };
  },
  computed: {
    isRoot() {
      return this.path.length === 0;
    },
    title() {
      return this.schema.title || this.humanize(this.path[this.path.length - 1]) || '';
    },
    summary() {
      const val = this.modelValue || {};
      const parts = [];
      for (const key of Object.keys(this.schema.properties || {})) {
        if (parts.length >= 3) break;
        const v = val[key];
        if (v !== null && v !== undefined && v !== '' && typeof v !== 'object') {
          parts.push(String(v));
        }
      }
      return parts.join(' · ');
    },
  },
  methods: {
    humanize(str) {
      if (!str) return '';
      return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },
    collapse() {
      this.collapsed = true;
    },
    expand() {
      this.collapsed = false;
    },
    onChildChange(key, value) {
      const newVal = { ...(this.modelValue || {}), [key]: value };
      this.$emit('update:modelValue', newVal);
    },
  },
};
</script>
