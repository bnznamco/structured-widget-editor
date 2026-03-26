import { createApp, ref, shallowRef, computed } from 'vue';
import { SchemaForm } from '@structured-field/widget-editor';
import '@structured-field/widget-editor/scss';

// ── Custom editor example ────────────────────────────────────────────────────
// Overrides the built-in NumberEditor for the "price" field with a
// combined number input + range slider that shows a currency prefix.
const PriceEditor = {
  name: 'PriceEditor',
  props: {
    schema:     { type: Object, required: true },
    modelValue: { default: 0 },
    path:       { type: Array,  default: () => [] },
    form:       { type: Object, default: null },
  },
  emits: ['update:modelValue'],
  computed: {
    fieldErrors() {
      return this.form?.getErrorsForPath?.(this.path) ?? [];
    },
  },
  methods: {
    onInput(e) {
      this.$emit('update:modelValue', parseFloat(e.target.value) || 0);
    },
  },
  template: `
    <div class="sf-field" :class="{ errors: fieldErrors.length }">
      <label class="sf-label">{{ schema.title }}</label>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-weight:600;color:var(--body-quiet-color)">€</span>
        <input
          type="number"
          class="sf-input"
          step="0.01"
          :min="schema.minimum != null ? schema.minimum : undefined"
          :value="modelValue"
          @input="onInput"
          style="max-width:100px"
        />
        <input
          type="range"
          :min="schema.minimum != null ? schema.minimum : 0"
          :max="schema.maximum != null ? schema.maximum : 200"
          step="0.01"
          :value="modelValue"
          @input="onInput"
          style="flex:1"
        />
        <span style="font-size:13px;color:var(--body-quiet-color);min-width:48px;text-align:right">
          € {{ (modelValue || 0).toFixed(2) }}
        </span>
      </div>
      <ul v-if="fieldErrors.length" class="errorlist">
        <li v-for="(err, i) in fieldErrors" :key="i">{{ err }}</li>
      </ul>
    </div>
  `,
};

const sampleData = {
  title: 'One Hundred Years of Solitude',
  isbn: '978-0-06-088328-7',
  description: 'The multi-generational story of the Buendía family in the fictional town of Macondo.',
  pages: 417,
  price: 14.99,
  published: true,
  status: 'published',
  language: 'es',
  main_author: { id: 1, name: 'Gabriel García Márquez', model: 'library.Author' },
  co_authors: [],
  publisher: { id: 3, name: 'Editorial Sudamericana', model: 'library.Publisher' },
  categories: [
    { id: 7, name: 'Historical Fiction', model: 'library.Category' },
    { id: 8, name: 'Literary Fiction', model: 'library.Category' },
  ],
  notes: 'Winner of the Nobel Prize in Literature (1982).',
  chapters: [
    { title: 'Chapter I', pages: 24 },
    { title: 'Chapter II', pages: 31 },
    { title: 'Chapter III', pages: 28 },
  ],
  format: {
    format_type: 'physical',
    weight_grams: 340,
    dimensions: '20.3 x 13.3 x 2.3 cm',
  },
};

const app = createApp({
  components: { SchemaForm },
  setup() {
    const schema = shallowRef({});
    const initialData = ref(undefined);
    const currentValue = ref(null);
    const validation = ref(null);
    const validationErrors = ref({});
    const statusText = ref('Ready');

    const customEditors = [
      { match: (s, path) => path.at(-1) === 'price', component: PriceEditor },
    ];

    // Fetch schema from API
    fetch('/api/schema')
      .then((r) => r.json())
      .then((s) => { schema.value = s; });

    const jsonOutput = computed(() => {
      return currentValue.value != null
        ? JSON.stringify(currentValue.value, null, 2)
        : '{}';
    });

    const onFormChange = (val) => {
      currentValue.value = val;
      statusText.value = `Updated at ${new Date().toLocaleTimeString()}`;
    };

    const validateData = async () => {
      const data = currentValue.value;
      if (!data) {
        validation.value = { valid: false, errors: { _root: ['No data to validate.'] } };
        validationErrors.value = {};
        return;
      }
      try {
        const res = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        validation.value = await res.json();
        validationErrors.value = validation.value.valid ? {} : (validation.value.errors || {});
        statusText.value = validation.value.valid ? 'Validation passed' : 'Validation failed';
      } catch (err) {
        validation.value = { valid: false, errors: { _root: [err.message] } };
        validationErrors.value = {};
        statusText.value = 'Validation error';
      }
    };

    const loadSampleData = () => {
      initialData.value = { ...sampleData };
      currentValue.value = { ...sampleData };
      validation.value = null;
      validationErrors.value = {};
      statusText.value = 'Sample data loaded';
    };

    const resetForm = () => {
      initialData.value = {};
      currentValue.value = {};
      validation.value = null;
      validationErrors.value = {};
      statusText.value = 'Form reset';
    };

    const copyJSON = () => {
      navigator.clipboard.writeText(jsonOutput.value);
      statusText.value = 'Copied to clipboard';
    };

    return {
      schema,
      initialData,
      customEditors,
      jsonOutput,
      validation,
      validationErrors,
      statusText,
      onFormChange,
      validateData,
      loadSampleData,
      resetForm,
      copyJSON,
    };
  },
});

app.mount('#app');
