<template>
  <div class="sf-field sf-field-json" :class="{ errors: fieldErrors.length }">
    <span class="sf-label" :class="{ required: isRequired }">{{ title }}</span>
    <div class="sf-json-editor" :class="{ 'sf-json-error': hasErrors }">
      <div class="sf-json-toolbar">
        <span v-if="loadError" class="sf-json-error-msg">{{ loadError }}</span>
        <button v-if="ready" type="button" class="sf-btn sf-btn-sm sf-json-format-btn" @click="format">
          Format
        </button>
      </div>
      <div ref="aceContainer" class="sf-json-ace-container" />
      <textarea
        v-if="!ready"
        class="sf-input sf-textarea sf-json-textarea-fallback"
        :value="rawValue"
        spellcheck="false"
        @input="onFallbackInput"
      />
    </div>
    <ul v-if="fieldErrors.length" class="errorlist">
      <li v-for="(err, i) in fieldErrors" :key="i">{{ err }}</li>
    </ul>
  </div>
</template>

<script>
const ACE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.37.5/ace.min.js';

function loadAce() {
  if (window.ace) return Promise.resolve(window.ace);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${ACE_CDN}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.ace));
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = ACE_CDN;
    s.async = true;
    s.onload = () => resolve(window.ace);
    s.onerror = () => reject(new Error('Failed to load Ace Editor'));
    document.head.appendChild(s);
  });
}

export default {
  name: 'JsonEditor',
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: null },
    path: { type: Array, default: () => [] },
    form: { type: Object, default: null },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      rawValue: this.modelValue != null ? JSON.stringify(this.modelValue, null, 2) : '{}',
      ready: false,
      hasErrors: false,
      loadError: null,
      _editor: null,
      _silent: false,
    };
  },
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
  watch: {
    modelValue(val) {
      if (this._silent) return;
      const external = val != null ? JSON.stringify(val, null, 2) : '{}';
      try {
        if (JSON.stringify(JSON.parse(this.rawValue)) !== JSON.stringify(val)) {
          this.rawValue = external;
          if (this._editor) {
            this._silent = true;
            this._editor.setValue(external, -1);
            this._silent = false;
          }
        }
      } catch { /* rawValue is invalid, leave it */ }
    },
  },
  async mounted() {
    try {
      const ace = await loadAce();
      const container = this.$refs.aceContainer;
      if (!container) return;

      const editor = ace.edit(container);
      editor.setTheme(this._isDark() ? 'ace/theme/one_dark' : 'ace/theme/chrome');
      editor.session.setMode('ace/mode/json');
      editor.session.setTabSize(2);
      editor.session.setUseSoftTabs(true);
      editor.setShowPrintMargin(false);
      editor.setOption('minLines', 5);
      editor.setOption('maxLines', 20);
      editor.setValue(this.rawValue, -1);
      editor.$blockScrolling = Infinity;

      editor.session.on('change', () => {
        if (this._silent) return;
        const text = editor.getValue();
        this.rawValue = text;
        try {
          const parsed = JSON.parse(text);
          this.hasErrors = false;
          this._silent = true;
          this.$emit('update:modelValue', parsed);
          this._silent = false;
        } catch {
          this.hasErrors = true;
        }
      });

      // Reflect annotation (lint) errors on hasErrors
      editor.session.on('changeAnnotation', () => {
        const annotations = editor.session.getAnnotations();
        this.hasErrors = annotations.some(a => a.type === 'error');
      });

      this._editor = editor;
      this.ready = true;
    } catch (err) {
      this.loadError = `Editor unavailable: ${err.message}`;
    }
  },
  beforeUnmount() {
    if (this._editor) {
      this._editor.destroy();
      this._editor = null;
    }
  },
  methods: {
    humanize(str) {
      if (!str) return '';
      return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },
    _isDark() {
      return document.documentElement.dataset.colorScheme === 'dark' ||
        window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    },
    format() {
      if (!this._editor) return;
      try {
        const formatted = JSON.stringify(JSON.parse(this._editor.getValue()), null, 2);
        this._silent = true;
        this._editor.setValue(formatted, -1);
        this._silent = false;
        this.rawValue = formatted;
      } catch { /* invalid JSON */ }
    },
    onFallbackInput(e) {
      this.rawValue = e.target.value;
      try { this.$emit('update:modelValue', JSON.parse(this.rawValue)); } catch { /* ignore */ }
    },
  },
};
</script>
