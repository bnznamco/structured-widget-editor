<template>
  <div class="sf-field sf-relation" :class="{ errors: fieldErrors.length }" ref="root">
    <label class="sf-label" :class="{ required: isRequired }">{{ title }}</label>
    <div class="sf-relation-wrapper">
      <!-- Selected items -->
      <div v-if="selected.length" class="sf-relation-selected">
        <div v-for="item in selected" :key="itemKey(item)" class="sf-relation-tag">
          <span class="sf-relation-tag-text">{{ getDisplayName(item) }}</span>
          <button v-if="isMultiple || allowClear" type="button" class="sf-relation-tag-remove"
            @click.stop="removeItem(item)">
            <SfIcon name="times" />
          </button>
        </div>
      </div>

      <!-- Search box -->
      <div v-show="showSearch" class="sf-relation-search">
        <input ref="searchInput" type="text" class="sf-input sf-relation-input" :placeholder="placeholder"
          autocomplete="off" v-model="searchQuery" @input="onSearchInput" @focus="openDropdown"
          @keydown="handleKeyDown" />
        <!-- Dropdown -->
        <div v-show="dropdownVisible" class="sf-relation-dropdown">
          <div v-if="filteredResults.length === 0 && !loading" class="sf-relation-dropdown-empty">
            No results found
          </div>
          <div v-for="(item, i) in filteredResults" :key="itemKey(item)" class="sf-relation-dropdown-item"
            :class="{ highlighted: i === highlightIndex }" @click="selectItem(item)">
            {{ getDisplayName(item) }}
          </div>
          <div v-if="hasMore" class="sf-relation-dropdown-more" @click="fetchResults(searchQuery, currentPage + 1)">
            Load more...
          </div>
        </div>
      </div>
    </div>
    <ul v-if="fieldErrors.length" class="errorlist">
      <li v-for="(err, i) in fieldErrors" :key="i">{{ err }}</li>
    </ul>
  </div>
</template>

<script>
import { debounce } from '../utils';
import SfIcon from './SfIcon.vue';

export default {
  name: 'RelationEditor',
  components: { SfIcon },
  props: {
    schema: { type: Object, required: true },
    modelValue: { default: null },
    path: { type: Array, default: () => [] },
    form: { type: Object, default: null },
  },
  emits: ['update:modelValue'],
  data() {
    const isMultiple = !!this.schema.multiple;
    const value = this.modelValue;
    let selected;
    if (isMultiple) {
      selected = Array.isArray(value) ? [...value] : [];
    } else {
      selected = value ? [value] : [];
    }
    return {
      isMultiple,
      allowClear: this.schema.options?.select2?.allowClear ?? true,
      placeholder: this.schema.options?.select2?.placeholder || 'Search...',
      searchUrl: this.schema.options?.select2?.ajax?.url || '',
      selected,
      dropdownVisible: false,
      searchResults: [],
      currentPage: 1,
      hasMore: false,
      loading: false,
      highlightIndex: -1,
      searchQuery: '',
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
    showSearch() {
      if (!this.isMultiple && this.selected.length > 0) return false;
      return true;
    },
    fieldErrors() {
      if (!this.form || !this.form.getErrorsForPath) return [];
      return this.form.getErrorsForPath(this.path);
    },
    filteredResults() {
      const selectedIds = new Set(this.selected.map(s => `${s.id}-${s.model || ''}`));
      return this.searchResults.filter(item => !selectedIds.has(`${item.id}-${item.model || ''}`));
    },
  },
  created() {
    this._doSearch = debounce((query) => this.fetchResults(query, 1), 300);
    this._onDocClick = (e) => {
      if (this.$refs.root && !this.$refs.root.contains(e.target)) {
        this.closeDropdown();
      }
    };
  },
  mounted() {
    document.addEventListener('click', this._onDocClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this._onDocClick);
  },
  methods: {
    humanize(str) {
      if (!str) return '';
      return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },
    getDisplayName(item) {
      if (!item) return '';
      for (const key of ['__str__', 'name', 'title', 'label']) {
        if (item[key]) return String(item[key]);
      }
      return `#${item.id || '?'}`;
    },
    itemKey(item) {
      return `${item.id}-${item.model || ''}`;
    },
    onSearchInput() {
      this._doSearch(this.searchQuery);
    },
    openDropdown() {
      if (this.dropdownVisible) return;
      this.dropdownVisible = true;
      this.fetchResults(this.searchQuery, 1);
    },
    closeDropdown() {
      this.dropdownVisible = false;
      this.highlightIndex = -1;
    },
    async fetchResults(query, page) {
      if (!this.searchUrl) return;
      this.loading = true;
      this.currentPage = page;

      try {
        const url = new URL(this.searchUrl, window.location.origin);
        url.searchParams.set('_q', query || '');
        url.searchParams.set('page', String(page));

        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok) return;
        const data = await response.json();

        if (page === 1) {
          this.searchResults = data.items || [];
        } else {
          this.searchResults = this.searchResults.concat(data.items || []);
        }
        this.hasMore = data.more;
      } finally {
        this.loading = false;
      }
    },
    handleKeyDown(e) {
      if (!this.filteredResults.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.highlightIndex = Math.min(this.highlightIndex + 1, this.filteredResults.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.highlightIndex = Math.max(this.highlightIndex - 1, 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.highlightIndex >= 0 && this.highlightIndex < this.filteredResults.length) {
          this.selectItem(this.filteredResults[this.highlightIndex]);
        }
      } else if (e.key === 'Escape') {
        this.closeDropdown();
      }
    },
    selectItem(item) {
      if (this.isMultiple) {
        this.selected.push(item);
      } else {
        this.selected = [item];
      }
      this.searchQuery = '';
      this.highlightIndex = -1;
      this.closeDropdown();
      this.emitValue();
    },
    removeItem(item) {
      this.selected = this.selected.filter(s => !(s.id === item.id && (s.model || '') === (item.model || '')));
      this.emitValue();
    },
    emitValue() {
      if (this.isMultiple) {
        this.$emit('update:modelValue', [...this.selected]);
      } else {
        this.$emit('update:modelValue', this.selected[0] || null);
      }
    },
  },
};
</script>
