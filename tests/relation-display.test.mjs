import { describe, it, expect } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import RelationEditor from '../src/editors/RelationEditor.vue'

// Mount RelationEditor directly and expose its instance so tests can drive the
// (otherwise network-fed) search results without hitting fetch.
function mountRelation(props) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const changes = []
  let inst = null
  const app = createApp({
    mounted() {
      inst = this.$refs.ed
    },
    render() {
      return h(RelationEditor, {
        ref: 'ed',
        path: ['rel'],
        ...props,
        'onUpdate:modelValue': (v) => changes.push(v),
      })
    },
  })
  app.mount(el)
  return { el, changes, app, inst: () => inst }
}

// A relation schema with an empty ajax url -> no fetch is ever issued on mount.
function relSchema(extraOptions = {}, multiple = false) {
  return {
    type: 'relation',
    multiple,
    model: 'app.Thing',
    options: { select2: { ajax: { url: '' } }, ...extraOptions },
  }
}

describe('RelationEditor rich item rendering', () => {
  it('renders an image and a secondary description in dropdown items', async () => {
    const { el, inst } = mountRelation({ schema: relSchema(), modelValue: null })
    inst().searchResults = [
      { id: 1, name: 'Poster A', model: 'app.Thing', image: 'http://x/1.png', description: 'A poster' },
    ]
    inst().dropdownVisible = true
    await nextTick()

    const item = el.querySelector('.sf-relation-dropdown-item')
    expect(item).not.toBeNull()
    const img = item.querySelector('.sf-relation-item-image')
    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toBe('http://x/1.png')
    expect(item.querySelector('.sf-relation-item-name').textContent.trim()).toBe('Poster A')
    expect(item.querySelector('.sf-relation-item-description').textContent.trim()).toBe('A poster')
  })

  it('omits the image/description nodes when the item carries none', async () => {
    const { el, inst } = mountRelation({ schema: relSchema(), modelValue: null })
    inst().searchResults = [{ id: 2, name: 'Plain', model: 'app.Thing' }]
    inst().dropdownVisible = true
    await nextTick()

    const item = el.querySelector('.sf-relation-dropdown-item')
    expect(item.querySelector('.sf-relation-item-image')).toBeNull()
    expect(item.querySelector('.sf-relation-item-description')).toBeNull()
    expect(item.querySelector('.sf-relation-item-name').textContent.trim()).toBe('Plain')
  })

  it('renders the thumbnail on a selected tag', async () => {
    const { el } = mountRelation({
      schema: relSchema(),
      modelValue: { id: 3, name: 'Chosen', model: 'app.Thing', image: 'http://x/3.png' },
    })
    await nextTick()

    const tagImg = el.querySelector('.sf-relation-tag .sf-relation-tag-image')
    expect(tagImg).not.toBeNull()
    expect(tagImg.getAttribute('src')).toBe('http://x/3.png')
    expect(el.querySelector('.sf-relation-tag-text').textContent.trim()).toBe('Chosen')
  })

  it('infinite scroll: fetches the next page near the bottom only when more & idle', async () => {
    const { inst } = mountRelation({ schema: relSchema(), modelValue: null })
    const ed = inst()
    const calls = []
    ed.fetchResults = (q, page) => calls.push([q, page]) // stub out the network
    ed.searchQuery = 'foo'
    ed.currentPage = 2
    // happy-dom geometry is all-zero, so the "near bottom" check is satisfied;
    // this isolates the hasMore / loading guards.
    ed.dropdownVisible = true
    await nextTick()

    ed.hasMore = true
    ed.loading = false
    ed.onDropdownScroll()
    expect(calls).toEqual([['foo', 3]]) // currentPage + 1

    // already loading -> no duplicate request
    ed.loading = true
    ed.onDropdownScroll()
    expect(calls.length).toBe(1)

    // no more pages -> no request
    ed.loading = false
    ed.hasMore = false
    ed.onDropdownScroll()
    expect(calls.length).toBe(1)
  })

  it('honours configurable field names via options.itemImage / itemDescription', async () => {
    const { el, inst } = mountRelation({
      schema: relSchema({ itemImage: 'thumb', itemDescription: 'subtitle' }),
      modelValue: null,
    })
    inst().searchResults = [
      { id: 4, name: 'Custom', model: 'app.Thing', thumb: 'http://x/4.png', subtitle: 'sub', image: 'IGNORED' },
    ]
    inst().dropdownVisible = true
    await nextTick()

    const item = el.querySelector('.sf-relation-dropdown-item')
    expect(item.querySelector('.sf-relation-item-image').getAttribute('src')).toBe('http://x/4.png')
    expect(item.querySelector('.sf-relation-item-description').textContent.trim()).toBe('sub')
  })
})
