import { createApp, ref, shallowRef, computed } from 'vue';
import { SchemaForm } from '@structured/widget-editor';
import '@structured/widget-editor/scss';

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
    const statusText = ref('Ready');

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
      validation.value = null;
      statusText.value = `Updated at ${new Date().toLocaleTimeString()}`;
    };

    const validateData = async () => {
      const data = currentValue.value;
      if (!data) {
        validation.value = { valid: false, errors: { _root: ['No data to validate.'] } };
        return;
      }
      try {
        const res = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        validation.value = await res.json();
        statusText.value = validation.value.valid ? 'Validation passed' : 'Validation failed';
      } catch (err) {
        validation.value = { valid: false, errors: { _root: [err.message] } };
        statusText.value = 'Validation error';
      }
    };

    const loadSampleData = () => {
      initialData.value = { ...sampleData };
      currentValue.value = { ...sampleData };
      validation.value = null;
      statusText.value = 'Sample data loaded';
    };

    const resetForm = () => {
      initialData.value = {};
      currentValue.value = {};
      validation.value = null;
      statusText.value = 'Form reset';
    };

    const copyJSON = () => {
      navigator.clipboard.writeText(jsonOutput.value);
      statusText.value = 'Copied to clipboard';
    };

    return {
      schema,
      initialData,
      jsonOutput,
      validation,
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
