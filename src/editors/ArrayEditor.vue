<template>
  <div class="sf-array" :class="{ errors: fieldErrors.length }">
    <div class="sf-array-header">
      <span class="sf-label">{{ title }}</span>
      <span class="sf-array-count">{{ items.length }}</span>
      <button type="button" class="sf-btn sf-btn-add" @click="addItem()">
        <SfIcon name="plus" /> Add
      </button>
      <span v-if="items.length" class="sf-array-collapse-toggle" :title="allCollapsed ? 'Expand all' : 'Collapse all'" @click="toggleCollapseAll">
        <SfIcon :name="allCollapsed ? 'chevron-down' : 'chevron-up'" />
      </span>
    </div>
    <div class="sf-array-items">
      <div
        v-for="(item, index) in items"
        :key="item._key"
        class="sf-array-item"
        :class="{ 'sf-drag-over': dragOverIndex === index, 'sf-dragging': dragSourceIndex === index }"
        draggable="true"
        @dragstart="onDragStart(index, $event)"
        @dragover.prevent="onDragOver(index)"
        @dragleave="onDragLeave(index)"
        @drop.prevent="onDrop(index)"
        @dragend="onDragEnd"
      >
        <div class="sf-array-item-header">
          <div class="sf-array-item-left">
            <span class="sf-drag-handle" title="Drag to reorder"><SfIcon name="grip" /></span>
            <span class="sf-array-item-index">#{{ index + 1 }}</span>
          </div>
          <div class="sf-array-item-actions">
            <button v-if="index > 0" type="button" class="sf-btn sf-btn-sm" @click="moveItem(index, -1)">
              <SfIcon name="arrow-up" />
            </button>
            <button v-if="index < items.length - 1" type="button" class="sf-btn sf-btn-sm" @click="moveItem(index, 1)">
              <SfIcon name="arrow-down" />
            </button>
            <button type="button" class="sf-btn sf-btn-sm sf-btn-danger" @click="removeItem(index)">
              <SfIcon name="times" />
            </button>
          </div>
        </div>
        <div class="sf-array-item-body" @dragover.prevent @drop.prevent="onDrop(index)">
          <SchemaEditor
            ref="itemEditors"
            :schema="itemSchema"
            :model-value="item.value"
            :path="[...path, String(index)]"
            :form="form"
            @update:model-value="onItemChange(index, $event)"
          />
        </div>
      </div>
    </div>
    <ul v-if="fieldErrors.length" class="errorlist">
      <li v-for="(err, i) in fieldErrors" :key="i">{{ err }}</li>
    </ul>
  </div>
</template>

<script>
import { getDefaultForSchema } from '../utils';
import SfIcon from './SfIcon.vue';

let keyCounter = 0;

import SchemaEditor from './SchemaEditor.vue';

export default {
  name: 'ArrayEditor',
  beforeCreate() {
    if (!this.$options.components) this.$options.components = {};
    this.$options.components.SchemaEditor = SchemaEditor;
    this.$options.components.SfIcon = SfIcon;
  },
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: () => [] },
    path: { type: Array, default: () => [] },
    form: { type: Object, required: true },
  },
  emits: ['update:modelValue'],
  data() {
    const arr = Array.isArray(this.modelValue) ? this.modelValue : [];
    return {
      items: arr.map(v => ({ _key: keyCounter++, value: v })),
      dragSourceIndex: null,
      dragOverIndex: null,
      allCollapsed: false,
    };
  },
  computed: {
    title() {
      return this.schema.title || this.humanize(this.path[this.path.length - 1]) || '';
    },
    itemSchema() {
      return this.form.resolveSchema(this.schema.items || {});
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
    addItem() {
      const value = getDefaultForSchema(this.itemSchema);
      this.items.push({ _key: keyCounter++, value });
      this.emitValue();
    },
    removeItem(index) {
      this.items.splice(index, 1);
      this.emitValue();
    },
    moveItem(index, direction) {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= this.items.length) return;
      const temp = this.items[index];
      this.items.splice(index, 1, this.items[newIndex]);
      this.items.splice(newIndex, 1, temp);
      this.emitValue();
    },
    onItemChange(index, value) {
      this.items[index].value = value;
      this.emitValue();
    },
    onDragStart(index, event) {
      this.dragSourceIndex = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    },
    onDragOver(index) {
      if (this.dragSourceIndex !== null && index !== this.dragSourceIndex) {
        this.dragOverIndex = index;
      }
    },
    onDragLeave(index) {
      if (this.dragOverIndex === index) {
        this.dragOverIndex = null;
      }
    },
    onDrop(index) {
      if (this.dragSourceIndex === null || this.dragSourceIndex === index) return;
      const moved = this.items.splice(this.dragSourceIndex, 1)[0];
      this.items.splice(index, 0, moved);
      this.dragSourceIndex = null;
      this.dragOverIndex = null;
      this.emitValue();
    },
    onDragEnd() {
      this.dragSourceIndex = null;
      this.dragOverIndex = null;
    },
    toggleCollapseAll() {
      this.allCollapsed = !this.allCollapsed;
      const editors = this.$refs.itemEditors;
      if (!editors) return;
      const list = Array.isArray(editors) ? editors : [editors];
      if (this.allCollapsed) {
        list.forEach(editor => editor?.collapseAll?.());
      } else {
        list.forEach(editor => editor?.expandAll?.());
      }
    },
    emitValue() {
      this.$emit('update:modelValue', this.items.map(i => i.value));
    },
  },
};
</script>
