<script>
import { h, ref, watch, onMounted, onBeforeUnmount } from 'vue';

export default {
  name: 'WebComponentWrapper',
  props: {
    tagName: { type: String, required: true },
    schema: { type: Object, required: true },
    modelValue: { default: undefined },
    path: { type: Array, default: () => [] },
    form: { type: Object, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const elRef = ref(null);

    function syncProps() {
      const el = elRef.value;
      if (!el) return;
      el.schema = props.schema;
      el.modelValue = props.modelValue;
      el.path = props.path;
      el.form = props.form;
    }

    function handleChange(e) {
      const value = e.detail != null
        ? (Array.isArray(e.detail) ? e.detail[0] : e.detail)
        : undefined;
      emit('update:modelValue', value);
    }

    onMounted(() => {
      syncProps();
      const el = elRef.value;
      if (el) {
        el.addEventListener('update:model-value', handleChange);
        el.addEventListener('change', handleChange);
      }
    });

    onBeforeUnmount(() => {
      const el = elRef.value;
      if (el) {
        el.removeEventListener('update:model-value', handleChange);
        el.removeEventListener('change', handleChange);
      }
    });

    watch(() => [props.schema, props.modelValue, props.path, props.form], syncProps, { deep: true });

    return () => h(props.tagName, { ref: elRef });
  },
};
</script>
