<style lang="sass">
// 以下CSSクラスの詳細は次を参考:
//   https://quasar.dev/vue-components/table#Sticky-header%2Fcolumn
.StorageDirTable__q-table
  height: 100%

  /* max height is important */
  .q-table__middle
    height: 100%

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: white

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
</style>

<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.table
  color: $text-primary-color
</style>

<template>
  <q-table
    ref="table"
    class="StorageDirTable StorageDirTable__q-table table"
    :data="data"
    :columns="columns"
    :sort-method="sortMethod"
    selection="multiple"
    :selected.sync="syncSelected"
    binary-state-sort
    :row-key="rowKey"
    hide-bottom
    flat
    :loading="loading"
    virtual-scroll
    :pagination.sync="pagination"
    :rows-per-page-options="[0]"
    @selection="onSelection"
  >
    <template v-slot:body="tr">
      <slot name="body" :tr="tr"></slot>
    </template>
  </q-table>
</template>

<script lang="ts">
import { LooseDictionary, QTable, QTableColumn } from 'quasar'
import { computed, defineComponent, reactive, ref, watch } from '@vue/composition-api'

interface StorageDirTable<T = any> extends StorageDirTable.Props<T> {
  sort(col: string | LooseDictionary): void
  setScrollTop(value: number): void
}

namespace StorageDirTable {
  export interface Props<T = any> {
    columns: QTableColumn[]
    data: T[]
    selected: T[]
    loading: boolean
    rowKey: string
    sortMethod?: SortMethod<T>
    filteredSortedRows: T[]
  }

  export type SortMethod<T = any, U = string> = (rows: T[], sortBy?: U, descending?: boolean) => T[]

  export const clazz = defineComponent({
    name: 'StorageDirTable',

    props: {
      columns: { type: Array, default: () => [] },
      data: { type: Array, default: () => [] },
      selected: { type: Array, default: () => [] },
      loading: { type: Boolean, default: false },
      rowKey: { type: String, required: true },
      sortMethod: { type: Function, required: false },
    },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const table = ref<QTable>()

      const state = reactive({
        selected: [] as any[],
        pagination: {
          rowsPerPage: 0,
        },
      })

      const syncSelected = computed({
        get: () => state.selected,
        set: value => {
          ctx.emit('update:selected', value)
          state.selected = value
        },
      })

      const pagination = computed({
        get: () => state.pagination,
        set: value => (state.pagination = value),
      })

      //----------------------------------------------------------------------
      //
      //  Properties
      //
      //----------------------------------------------------------------------

      const filteredSortedRows = computed(() => (table.value as any).filteredSortedRows)

      //----------------------------------------------------------------------
      //
      //  Methods
      //
      //----------------------------------------------------------------------

      const sort: StorageDirTable['sort'] = col => {
        return table.value!.sort(col)
      }

      const setScrollTop: StorageDirTable['setScrollTop'] = value => {
        table.value!.$el.querySelector('.scroll')!.scrollTop = value
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      watch(
        () => props.selected,
        newValue => (state.selected = newValue),
        { immediate: true }
      )

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      async function onSelection(e: { rows: any[]; keys: string[]; added: boolean; evt: any }) {
        ctx.emit('selection', e)
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        table,
        state,
        syncSelected,
        pagination,
        filteredSortedRows,
        sort,
        setScrollTop,
        onSelection,
      }
    },
  })
}

export default StorageDirTable.clazz
export { StorageDirTable }
</script>
