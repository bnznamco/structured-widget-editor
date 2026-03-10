<template>
  <div class="structured-field-editor">
    <SchemaEditor
      v-if="resolvedSchema"
      :schema="resolvedSchema"
      :model-value="currentValue"
      :path="[]"
      :form="formApi"
      @update:model-value="onValueChange"
    />
  </div>
</template>

<script>
import SchemaEditor from './editors/SchemaEditor.vue';
import { deepClone } from './utils';

export default {
  name: 'SchemaForm',
  components: { SchemaEditor },
  props: {
    schema: { type: [Object, String], default: () => ({}) },
    initialData: { default: undefined },
    errors: { type: Object, default: () => ({}) },
  },
  emits: ['change'],
  data() {
    const parsedSchema = typeof this.schema === 'string' ? JSON.parse(this.schema) : this.schema;
    const defs = parsedSchema.$defs || parsedSchema.definitions || {};
    return {
      rootSchema: parsedSchema,
      defs,
      currentValue: this.initialData != null ? deepClone(this.initialData) : undefined,
    };
  },
  computed: {
    resolvedSchema() {
      return this.resolveSchema(this.rootSchema);
    },
    formApi() {
      return {
        resolveSchema: (s) => this.resolveSchema(s),
        getSchemaAtPath: (p) => this.getSchemaAtPath(p),
        getErrorsForPath: (p) => this.getErrorsForPath(p),
      };
    },
  },
  watch: {
    schema: {
      handler(val) {
        const parsed = typeof val === 'string' ? JSON.parse(val) : val;
        this.rootSchema = parsed;
        this.defs = parsed.$defs || parsed.definitions || {};
      },
      deep: true,
    },
    initialData: {
      handler(val) {
        this.currentValue = val != null ? deepClone(val) : undefined;
      },
      deep: true,
    },
  },
  methods: {
    resolveSchema(schema) {
      if (!schema) return { type: 'string' };

      if (schema.$ref) {
        const refPath = schema.$ref.replace(/^#\/\$defs\//, '').replace(/^#\/definitions\//, '');
        const resolved = this.defs[refPath];
        if (!resolved) return { type: 'string', title: refPath };
        const { $ref, ...rest } = schema;
        return { ...this.resolveSchema(resolved), ...rest };
      }

      if (schema.anyOf) {
        const nonNull = schema.anyOf.filter(s => s.type !== 'null');
        const hasNull = schema.anyOf.some(s => s.type === 'null');
        if (hasNull && nonNull.length === 1) {
          const resolved = this.resolveSchema(nonNull[0]);
          return {
            ...resolved,
            _nullable: true,
            title: schema.title || resolved.title,
            default: 'default' in schema ? schema.default : null,
          };
        }
        if (nonNull.length >= 1) return this.resolveSchema(nonNull[0]);
      }

      if (schema.oneOf && schema.discriminator) return schema;

      if (schema.oneOf) {
        const nonNull = schema.oneOf.filter(s => s.type !== 'null');
        const hasNull = schema.oneOf.some(s => s.type === 'null');
        if (hasNull && nonNull.length === 1) {
          const resolved = this.resolveSchema(nonNull[0]);
          return {
            ...resolved,
            _nullable: true,
            title: schema.title || resolved.title,
            default: 'default' in schema ? schema.default : null,
          };
        }
        if (nonNull.length >= 1) return this.resolveSchema(nonNull[0]);
      }

      return schema;
    },

    getSchemaAtPath(path) {
      let schema = this.resolveSchema(this.rootSchema);
      for (const segment of path) {
        if (!schema) return null;
        if (schema.properties && schema.properties[segment]) {
          schema = this.resolveSchema(schema.properties[segment]);
        } else if (schema.items) {
          schema = this.resolveSchema(schema.items);
        } else {
          return null;
        }
      }
      return schema;
    },

    onValueChange(val) {
      this.currentValue = val;
      this.$emit('change', val);
    },

    getErrorsForPath(path) {
      if (!this.errors || typeof this.errors !== 'object') return [];
      const key = path.join('.');
      return this.errors[key] || [];
    },

    getValue() {
      return this.currentValue;
    },
  },
};
</script>
