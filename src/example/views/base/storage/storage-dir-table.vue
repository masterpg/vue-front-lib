<style lang="sass">
// 以下CSSクラスの詳細は次を参考:
//   https://quasar.dev/vue-components/table#Sticky-header%2Fcolumn
.storage-dir-table__q-table
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
@import 'src/example/styles/app.variables'

.table
  color: $text-primary-color
</style>

<template>
  <q-table
    ref="table"
    :data="data"
    :columns="columns"
    virtual-scroll
    :pagination.sync="m_pagination"
    :rows-per-page-options="[0]"
    :sort-method="sortMethod"
    selection="multiple"
    :selected.sync="m_syncSelected"
    binary-state-sort
    :row-key="rowKey"
    hide-bottom
    flat
    :loading="loading"
    class="storage-dir-table__q-table table"
    @selection="m_onSelection"
  >
    <template v-slot:body="tr">
      <slot name="body" :tr="tr"></slot>
    </template>
  </q-table>
</template>

<script lang="ts">
import { BaseComponent, NoCache } from '@/example/base'
import { Component, Prop, Watch } from 'vue-property-decorator'
import { LooseDictionary, QTable, QTableColumn } from 'quasar'

@Component({
  components: {},
})
export default class StorageDirTable extends BaseComponent {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ default: () => [] })
  columns!: QTableColumn[]

  @Prop({ default: () => [] })
  data!: any[]

  @Prop({ default: () => [] })
  selected!: any[]

  @Watch('selected', { immediate: true })
  private m_selectedChanged(newValue: any[]) {
    this.m_selected = newValue
  }

  private m_selected: any[] = []

  get m_syncSelected(): any[] {
    return this.m_selected
  }

  set m_syncSelected(value: any[]) {
    this.$emit('update:selected', value)
    this.m_selected = value
  }

  @Prop({ default: false })
  loading!: boolean

  @Prop({ required: true })
  rowKey!: string

  @Prop({ required: true })
  sortMethod!: <ROW>(rows: ROW[], sortBy: string, descending: boolean) => ROW[]

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_pagination = {
    rowsPerPage: 0,
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  protected get table(): QTable {
    return this.$refs.table as QTable
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  sort(col: string | LooseDictionary): void {
    this.table.sort(col)
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private async m_onSelection(e: { rows: any[]; keys: string[]; added: boolean; evt: any }) {
    this.$emit('selection', e)
  }
}
</script>
