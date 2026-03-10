<template>
  <div class="sf-array">
    <div class="sf-array-header">
      <span class="sf-label">{{ title }}</span>
      <span class="sf-array-count">{{ items.length }}</span>
      <button type="button" class="sf-btn sf-btn-add" @click="addItem()">
        <i class="fas fa-plus"></i> Add
      </button>
    </div>
    <div class="sf-array-items">
      <div v-for="(item, index) in items" :key="item._key" class="sf-array-item">
        <div class="sf-array-item-header">
          <span class="sf-array-item-index">#{{ index + 1 }}</span>
          <div class="sf-array-item-actions">
            <button v-if="index > 0" type="button" class="sf-btn sf-btn-sm" @click="moveItem(index, -1)">
              <i class="fas fa-arrow-up"></i>
            </button>
            <button type="button" class="sf-btn sf-btn-sm" @click="moveItem(index, 1)">
              <i class="fas fa-arrow-down"></i>
            </button>
            <button type="button" class="sf-btn sf-btn-sm sf-btn-danger" @click="removeItem(index)">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="sf-array-item-body">
          <SchemaEditor
            :schema="itemSchema"
            :model-value="item.value"
            :path="[...path, String(index)]"
            :form="form"
            @update:model-value="onItemChange(index, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { getDefaultForSchema } from '../utils';

let keyCounter = 0;

export default {
  name: 'ArrayEditor',
  components: { SchemaEditor: defineAsyncComponent(() => import('./SchemaEditor.vue')) },
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
    };
  },
  computed: {
    title() {
      return this.schema.title || this.humanize(this.path[this.path.length - 1]) || '';
    },
    itemSchema() {
      return this.form.resolveSchema(this.schema.items || {});
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
    emitValue() {
      this.$emit('update:modelValue', this.items.map(i => i.value));
    },
  },
};
</script>
