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

.main
  height: 100%
  padding: 16px

.path-blocks
  display: inline-block
  @extend %text-h6
  .path-block
    @extend %app-pseudo-link

.breadcrumbs-el-active
  @extend %app-link-text

.table-container
  height: 100%
  overflow: hidden
  margin-top: 16px

.label
  @extend %app-link-text
  cursor: pointer
  span
    vertical-align: middle
  &:hover
    span
      text-decoration: underline
</style>

<template>
  <div class="layout vertical main">
    <div class="layout horizontal">
      <div v-for="pathBlock of m_pathBlocks" :key="pathBlock.label" class="path-blocks">
        <span v-if="!pathBlock.last" class="path-block" @click="m_pathBlockOnClick(pathBlock.path)">{{ pathBlock.name }}</span>
        <span v-else>{{ pathBlock.name }}</span>
        <span v-show="!pathBlock.last" class="app-mx-8">/</span>
      </div>
    </div>

    <div class="table-container">
      <q-table
        ref="table"
        :data="m_children"
        :columns="m_columns"
        :pagination.sync="m_pagination"
        :rows-per-page-options="[0]"
        :sort-method="m_childrenSort"
        selection="multiple"
        :selected.sync="m_selected"
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
</template>

<script lang="ts">
import { BaseComponent, Resizable } from '../../../../lib/base/component'
import { NoCache, StorageNodeType } from '@/lib'
import { Component } from 'vue-property-decorator'
import { QTable } from 'quasar'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import { getStorageTreeRootNodeData } from '@/example/views/demo/storage/base'
import { mixins } from 'vue-class-component'
import { removeBothEndsSlash } from 'web-base-lib'
import { storageTreeStore } from '@/example/views/demo/storage/storage-tree-store'

class TableRow {
  constructor(private m_table: QTable) {}

  nodeType!: StorageNodeType

  label!: string

  value!: string

  icon!: string

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
  components: {},
})
export default class StorageDirView extends mixins(BaseComponent, Resizable) {
  private m_selected = []

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

  private m_columns = [
    { name: 'label', align: 'left', label: 'Name', field: 'label', sortable: true },
    { name: 'updated', align: 'left', label: 'Updated', field: 'updated', sortable: true },
  ]

  private m_dirPath: string | null = null

  private m_children: TableRow[] = []

  private m_childMap: { [value: string]: TableRow } = {}

  private m_pathBlocks: { name: string; path: string; last: boolean }[] = []

  private m_pagination = {
    rowsPerPage: 0,
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_table(): QTable {
    return this.$refs.table as QTable
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ビューに表示するディレクトリのパスを設定します。
   */
  setDirPath(dirPath: string): void {
    dirPath = removeBothEndsSlash(dirPath)
    if (this.m_dirPath !== dirPath) {
      this.m_children = []
      this.m_childMap = {}
      this.m_table.selected && this.m_table.selected.splice(0)
    }
    this.m_dirPath = dirPath

    this.m_setupPathBlocks()
    this.m_setupChildren()
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_setupPathBlocks(): void {
    this.m_pathBlocks.length = 0
    const pathBlocks = this.m_dirPath!.split('/').filter(item => !!item)
    for (let i = 0; i < pathBlocks.length; i++) {
      const pathBlock = pathBlocks.slice(0, i + 1)
      this.m_pathBlocks.push({
        name: pathBlock[pathBlock.length - 1],
        path: pathBlock.join('/'),
        last: i === pathBlocks.length - 1,
      })
    }

    const rootNodeData = getStorageTreeRootNodeData()
    this.m_pathBlocks.unshift({
      name: rootNodeData.label,
      path: rootNodeData.value,
      last: this.m_pathBlocks.length > 0 ? false : true,
    })
  }

  private m_setupChildren(): void {
    const dirNode = storageTreeStore.getNode(this.m_dirPath!)
    if (!dirNode) {
      throw new Error(`'storageTreeStore' does not have specified path's node: '${this.m_dirPath}'`)
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
   * パスのパンくずのブロックがクリックされた際のリスナです。
   * @param path
   */
  private m_pathBlockOnClick(path: string) {
    this.$emit('dir-selected', path)
  }

  /**
   * テーブル行の名称セルがクリックされた際のハンドラです。
   * @param row
   */
  private m_tableRowNameCellOnClick(row: TableRow) {
    if (row.nodeType === StorageNodeType.Dir) {
      this.$emit('dir-selected', row.value)
    } else if (row.nodeType === StorageNodeType.File) {
      this.$emit('file-selected', row.value)
    }
  }
}
</script>
