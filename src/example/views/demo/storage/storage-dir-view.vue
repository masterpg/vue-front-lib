<style lang="sass">
// 以下CSSクラスの詳細は次を参考:
//   https://quasar.dev/vue-components/table#Sticky-header%2Fcolumn
.storage-dir-children-view__table
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
@import '../../../styles/app.variables'

.storage-dir-view-main

.left-container
  overflow: hidden
  height: 100%

  .table-container
    overflow: hidden

    .label
      @extend %app-link-text
      cursor: pointer
      span
        vertical-align: middle
      &:hover
        span
          text-decoration: underline

.file-node-view
  width: 320px
</style>

<template>
  <div class="storage-dir-view-main layout horizontal">
    <div class="left-container layout vertical flex-1">
      <div ref="tableContainer" class="table-container flex-1">
        <q-table
          ref="table"
          :data="m_children"
          :columns="m_columns"
          :pagination.sync="m_pagination"
          :rows-per-page-options="[0]"
          :sort-method="m_childrenSort"
          selection="multiple"
          :selected.sync="m_selectedRows"
          binary-state-sort
          row-key="label"
          hide-bottom
          flat
          class="storage-dir-children-view__table"
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td auto-width>
                <q-checkbox v-model="props.selected" />
              </q-td>
              <q-td key="label" :props="props">
                <span class="label" @click="m_tableRowNameCellOnClick(props.row)">
                  <q-icon :name="props.row.icon" size="24px" class="app-mr-6" />
                  <span>{{ props.row.label }}</span>
                </span>
              </q-td>
              <q-td key="contentType" :props="props">{{ props.row.contentType }}</q-td>
              <q-td key="size" :props="props">{{ props.row.size }}</q-td>
              <q-td key="updated" :props="props">{{ props.row.updated }}</q-td>
              <!-- コンテキストメニュー -->
              <q-menu touch-position context-menu>
                <!-- 複数選択時 -->
                <q-list v-if="props.row.multiSelected" dense style="min-width: 100px">
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchMoveSelected(m_table.selected)">{{ $t('common.move') }}</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchDeleteSelected(m_table.selected)">{{ $t('common.delete') }}</q-item-section>
                  </q-item>
                </q-list>
                <!-- フォルダ用メニュー -->
                <q-list v-else-if="props.row.isDir" dense style="min-width: 100px">
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchCreateDirSelected(props.row)">
                      {{ $t('common.createSomehow', { somehow: $tc('common.folder', 1) }) }}
                    </q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchFilesUploadSelected(props.row)">
                      {{ $t('common.uploadSomehow', { somehow: $tc('common.file', 2) }) }}
                    </q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchDirUploadSelected(props.row)">
                      {{ $t('common.uploadSomehow', { somehow: $tc('common.folder', 1) }) }}
                    </q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchMoveSelected([props.row])">{{ $t('common.move') }}</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchRenameSelected(props.row)">{{ $t('common.rename') }}</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchDeleteSelected([props.row])">{{ $t('common.delete') }}</q-item-section>
                  </q-item>
                </q-list>
                <!-- ファイル用メニュー -->
                <q-list v-else-if="props.row.isFile" dense style="min-width: 100px">
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchMoveSelected([props.row])">{{ $t('common.move') }}</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchRenameSelected(props.row)">{{ $t('common.rename') }}</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchDeleteSelected([props.row])">{{ $t('common.delete') }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-tr>
          </template>
        </q-table>
      </div>
    </div>
    <storage-file-view v-show="m_visibleFileNodeView" ref="fileView" class="file-node-view" @close="m_fileViewOnClose" />
  </div>
</template>

<script lang="ts">
import { BaseComponent, Resizable } from '../../../../lib/base/component'
import { NoCache, StorageNodeType } from '@/lib'
import { Component } from 'vue-property-decorator'
import { QTable } from 'quasar'
import StorageFileView from '@/example/views/demo/storage/storage-file-view.vue'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import bytes from 'bytes'
import { mixins } from 'vue-class-component'
import { removeBothEndsSlash } from 'web-base-lib'
import { treeStore } from '@/example/views/demo/storage/storage-tree-store'

class TableRow {
  constructor(private m_table: QTable) {}

  nodeType!: StorageNodeType

  label!: string

  value!: string

  icon!: string

  contentType!: string

  size?: number

  updated!: string

  updatedNum!: number

  get isDir(): boolean {
    return this.nodeType === StorageNodeType.Dir
  }

  get isFile(): boolean {
    return this.nodeType === StorageNodeType.File
  }

  get selected(): boolean {
    if (!this.m_table.selected) return false
    return this.m_table.selected.includes(this)
  }

  get multiSelected(): boolean {
    if (!this.m_table.selected) return false
    return this.m_table.selected.length >= 2 && this.selected
  }
}

@Component({
  components: {
    StorageFileView,
  },
})
export default class StorageDirView extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    const labelCol = this.m_columns[0]
    this.m_table.sort(labelCol)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private get m_columns() {
    return [
      { name: 'label', align: 'left', label: this.$t('storage.nodeDetail.name'), field: 'label', sortable: true },
      { name: 'contentType', align: 'left', label: this.$t('storage.nodeDetail.type'), field: 'contentType', sortable: true },
      { name: 'size', align: 'right', label: this.$t('storage.nodeDetail.size'), field: 'size', sortable: true },
      { name: 'updated', align: 'left', label: this.$t('storage.nodeDetail.updated'), field: 'updated', sortable: true },
    ]
  }

  private m_dirPath: string | null = null

  private m_children: TableRow[] = []

  private m_childMap: { [value: string]: TableRow } = {}

  private m_pagination = {
    rowsPerPage: 0,
  }

  private m_selectedRows: TableRow[] = []

  private m_visibleFileNodeView = false

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_table(): QTable {
    return this.$refs.table as QTable
  }

  @NoCache
  private get m_fileView(): StorageFileView {
    return this.$refs.fileView as StorageFileView
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ビューに表示するディレクトリのパスを設定します。
   * @param dirPath
   */
  setDirPath(dirPath?: string): void {
    const clear = () => {
      this.m_children = []
      this.m_childMap = {}
      this.m_table.selected && this.m_table.selected.splice(0)
    }

    if (typeof dirPath !== 'string') {
      clear()
      return
    }

    dirPath = removeBothEndsSlash(dirPath)
    if (this.m_dirPath !== dirPath) {
      clear()
    }
    this.m_dirPath = dirPath

    this.m_visibleFileNodeView = false

    this.m_setupChildren()
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_setupChildren(): void {
    const dirNode = treeStore.getNode(this.m_dirPath!)
    if (!dirNode) {
      throw new Error(`'treeStore' does not have specified path's node: '${this.m_dirPath}'`)
    }

    const latestChildren: TableRow[] = []
    const latestChildMap: { [value: string]: TableRow } = {}
    for (const child of dirNode.children as StorageTreeNode[]) {
      const row = this.m_toTableRow(child)
      latestChildren.push(row)
      latestChildMap[row.value] = row
    }

    // 最新データにはないがビューには存在するノードを削除
    for (let i = 0; i < this.m_children.length; i++) {
      const child = this.m_children[i]
      const latestChild = latestChildMap[child.value]
      if (!latestChild) {
        // 最新データにはないノードを削除
        this.m_children.splice(i--, 1)
        delete this.m_childMap[child.value]
        // 選択ノードを格納している配列から最新データにないノードを削除
        if (this.m_table.selected) {
          const selectedIndex = this.m_table.selected.findIndex((row: TableRow) => {
            return row.value === child.value
          })
          selectedIndex >= 0 && this.m_table.selected.splice(selectedIndex, 1)
        }
      }
    }

    // 最新データをビューに反映
    for (const latestChild of latestChildren) {
      const child = this.m_childMap[latestChild.value]
      if (child) {
        this.m_populateTableRow(latestChild, child)
      } else {
        this.m_children.push(latestChild)
        this.m_childMap[latestChild.value] = latestChild
      }
    }
  }

  /**
   * `StorageTreeNode`を`TableRow`へ変換します。
   * @param node
   */
  private m_toTableRow(node: StorageTreeNode): TableRow {
    const tableRow = new TableRow(this.m_table)
    tableRow.nodeType = node.nodeType as StorageNodeType
    tableRow.label = node.nodeType === StorageNodeType.Dir ? `${node.label}/` : node.label
    tableRow.value = node.value
    tableRow.icon = node.nodeType === StorageNodeType.Dir ? 'folder' : 'description'
    tableRow.contentType = node.contentType
    tableRow.size = node.nodeType === StorageNodeType.Dir ? undefined : bytes(node.size)
    tableRow.updated = String(this.$d(node.updatedDate.toDate(), 'dateTime'))
    tableRow.updatedNum = node.updatedDate.unix()
    return tableRow
  }

  /**
   * 引数の`source`から`dest`へデータを投入します。
   * @param source
   * @param dest
   */
  private m_populateTableRow(source: TableRow, dest: TableRow): TableRow {
    return Object.assign(dest, {
      label: source.label,
      value: source.value,
      updated: source.updated,
    })
  }

  private m_childrenSort(rows: TableRow[], sortBy: string, descending: boolean) {
    const data = [...rows]

    if (sortBy) {
      data.sort((a, b) => {
        const x = descending ? b : a
        const y = descending ? a : b

        if (sortBy === 'label') {
          if (x.nodeType === StorageNodeType.Dir && y.nodeType === StorageNodeType.File) {
            return -1
          } else if (x.nodeType === StorageNodeType.File && y.nodeType === StorageNodeType.Dir) {
            return 1
          }
          return x[sortBy] > y[sortBy] ? 1 : x[sortBy] < y[sortBy] ? -1 : 0
        } else if (sortBy === 'updated') {
          return x.updatedNum - y.updatedNum
        } else {
          return x[sortBy] > y[sortBy] ? 1 : x[sortBy] < y[sortBy] ? -1 : 0
        }
      })
    }

    return data
  }

  private m_dispatchCreateDirSelected(row: TableRow): void {
    this.$emit('create-dir-selected', row.value)
  }

  private m_dispatchFilesUploadSelected(row: TableRow): void {
    this.$emit('files-upload-selected', row.value)
  }

  private m_dispatchDirUploadSelected(row: TableRow): void {
    this.$emit('dir-upload-selected', row.value)
  }

  private m_dispatchMoveSelected(rows: TableRow[]): void {
    this.$emit('move-selected', rows.map(node => node.value))
  }

  private m_dispatchRenameSelected(row: TableRow): void {
    this.$emit('rename-selected', row.value)
  }

  private m_dispatchDeleteSelected(rows: TableRow[]): void {
    this.$emit('delete-selected', rows.map(node => node.value))
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * テーブル行の名称セルがクリックされた際のリスナです。
   * @param row
   */
  private m_tableRowNameCellOnClick(row: TableRow) {
    if (row.nodeType === StorageNodeType.Dir) {
      this.$emit('dir-selected', row.value)
    } else if (row.nodeType === StorageNodeType.File) {
      this.$emit('file-selected', row.value)
      this.m_fileView.setFilePath(row.value)
      this.m_visibleFileNodeView = true
    }
  }

  /**
   * ファイルビューが閉じられる際のリスナです。
   */
  private m_fileViewOnClose() {
    this.m_visibleFileNodeView = false
  }
}
</script>
