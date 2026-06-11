<template>
  <div v-if="isRoot" class="sf-object sf-object-root">
    <div class="sf-object-fields">
      <SchemaEditor
        v-for="(propSchema, key) in (effectiveSchema.properties || {})"
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
        v-for="(propSchema, key) in (effectiveSchema.properties || {})"
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
import { applyConditionals, hasConditionals } from '../conditionals';

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
      // Values pruned when a conditional rule deactivated their field,
      // kept so toggling the controller back restores what the user typed.
      prunedStash: {},
    };
  },
  computed: {
    isRoot() {
      return this.path.length === 0;
    },
    title() {
      return this.schema.title || this.humanize(this.path[this.path.length - 1]) || '';
    },
    effectiveSchema() {
      if (!hasConditionals(this.schema)) return this.schema;
      return applyConditionals(this.schema, this.modelValue || {}, this.form?.resolveSchema);
    },
    summary() {
      const val = this.modelValue || {};
      const parts = [];
      for (const key of Object.keys(this.effectiveSchema.properties || {})) {
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
      this.$emit('update:modelValue', this.pruneInactive(newVal));
    },
    pruneInactive(value) {
      if (!hasConditionals(this.schema)) return value;
      const effective = applyConditionals(this.schema, value, this.form?.resolveSchema);
      const allowed = new Set(Object.keys(effective.properties || {}));
      let changed = false;
      const out = {};
      // restore stashed values for fields a rule just re-activated
      for (const k of allowed) {
        if (!(k in value) && k in this.prunedStash) {
          out[k] = this.prunedStash[k];
          delete this.prunedStash[k];
          changed = true;
        }
      }
      for (const k of Object.keys(value)) {
        if (allowed.has(k)) {
          out[k] = value[k];
        } else {
          // pruned from the emitted value (documented behavior), but kept
          // locally so a controller toggle round-trip is not destructive
          this.prunedStash[k] = value[k];
          changed = true;
        }
      }
      return changed ? out : value;
    },
  },
};
</script>
