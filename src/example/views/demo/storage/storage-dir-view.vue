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
      color: $app-link-color
      span
        @extend %app-link
        font-weight: map-get($text-weights, "medium")
        vertical-align: middle

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
          virtual-scroll
          :pagination.sync="m_pagination"
          :rows-per-page-options="[0]"
          :sort-method="m_childrenSort"
          selection="multiple"
          :selected.sync="m_selectedRows"
          binary-state-sort
          row-key="label"
          hide-bottom
          flat
          :loading="loading"
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
              <q-td key="share" :props="props">
                <q-icon :name="props.row.share.icon" size="24px" />
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
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchShareSelected(m_table.selected)">{{ $t('common.share') }}</q-item-section>
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
                    <q-item-section @click="m_dispatchShareSelected([props.row])">{{ $t('common.share') }}</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchDeleteSelected([props.row])">{{ $t('common.delete') }}</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable>
                    <q-item-section @click="m_dispatchReloadSelected(props.row)">{{ $t('common.reload') }}</q-item-section>
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
                    <q-item-section @click="m_dispatchShareSelected([props.row])">{{ $t('common.share') }}</q-item-section>
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
    <storage-node-detail-view
      v-show="m_visibleNodeDetailView"
      ref="nodeDetailView"
      class="file-node-view"
      :storage-type="storageType"
      @close="m_nodeDetailViewOnClose"
    />
  </div>
</template>

<script lang="ts">
import { BaseComponent, NoCache, Resizable, StorageNodeType } from '@/lib'
import { Component } from 'vue-property-decorator'
import { QTable } from 'quasar'
import StorageNodeDetailView from './storage-node-detail-view.vue'
import StorageTreeNode from './storage-tree-node.vue'
import { StorageTypeMixin } from './base'
import bytes from 'bytes'
import { mixins } from 'vue-class-component'
import { removeBothEndsSlash } from 'web-base-lib'

class TableRow {
  constructor(private m_table: QTable) {}

  nodeType!: StorageNodeType

  label!: string

  value!: string

  icon!: string

  contentType!: string

  size?: number

  share!: {
    icon: string
  }

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
    StorageNodeDetailView,
  },
})
export default class StorageDirView extends mixins(BaseComponent, Resizable, StorageTypeMixin) {
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
  //  Properties
  //
  //----------------------------------------------------------------------

  loading = false

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
      { name: 'share', align: 'center', label: this.$t('storage.nodeDetail.share'), field: 'share', sortable: true },
      { name: 'updated', align: 'left', label: this.$t('storage.nodeDetail.updated'), field: 'updated', sortable: true },
    ]
  }

  private m_dirPath: string | null = null

  private m_children: TableRow[] = []

  private m_childDict: { [value: string]: TableRow } = {}

  private m_pagination = {
    rowsPerPage: 0,
  }

  private m_selectedRows: TableRow[] = []

  private m_detailViewNode: StorageTreeNode | null = null

  private get m_visibleNodeDetailView(): boolean {
    return !!this.m_detailViewNode
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_table(): QTable {
    return this.$refs.table as QTable
  }

  @NoCache
  private get m_nodeDetailView(): StorageNodeDetailView {
    return this.$refs.nodeDetailView as StorageNodeDetailView
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
  setDirPath(dirPath: string | null): void {
    const clear = () => {
      this.m_children = []
      this.m_childDict = {}
      this.m_table.selected && this.m_table.selected.splice(0)
      this.m_detailViewNode = null
    }

    // 文字列以外が渡された場合、ビューをクリアして終了
    if (typeof dirPath !== 'string') {
      clear()
      return
    }

    dirPath = removeBothEndsSlash(dirPath)

    // 前回と今回で設定されるディレクトリパスが同じ場合
    if (this.m_dirPath === dirPath) {
      this.m_detailViewNode = (() => {
        if (!this.m_detailViewNode) return null
        return this.treeStore.getNode(this.m_detailViewNode.value) || null
      })()
      // ノード詳細ビューに表示されていたノードが存在する場合
      if (this.m_detailViewNode) {
        // ノード詳細ビューを更新
        this.m_nodeDetailView.setNodePath(this.m_detailViewNode.value)
      }
      // ノード詳細ビューに表示されていたノードが存在しない場合
      else {
        // ノード詳細ビューを非表示
        this.m_detailViewNode = null
      }
    }
    // 前回と今回で設定されるディレクトリパスが異なる場合
    else {
      // ビューをクリア
      clear()
    }

    this.m_dirPath = dirPath

    this.m_setupChildren()
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_setupChildren(): void {
    const dirNode = this.treeStore.getNode(this.m_dirPath!)
    if (!dirNode) {
      throw new Error(`'treeStore' does not have specified path's node: '${this.m_dirPath}'`)
    }

    const latestChildren: TableRow[] = []
    const latestChildDict: { [value: string]: TableRow } = {}
    for (const child of dirNode.children as StorageTreeNode[]) {
      const row = this.m_toTableRow(child)
      latestChildren.push(row)
      latestChildDict[row.value] = row
    }

    // 最新データにはないがビューには存在するノードを削除
    for (let i = 0; i < this.m_children.length; i++) {
      const child = this.m_children[i]
      const latestChild = latestChildDict[child.value]
      if (!latestChild) {
        // 最新データにはないノードを削除
        this.m_children.splice(i--, 1)
        delete this.m_childDict[child.value]
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
      const child = this.m_childDict[latestChild.value]
      if (child) {
        this.m_populateTableRow(latestChild, child)
      } else {
        this.m_children.push(latestChild)
        this.m_childDict[latestChild.value] = latestChild
      }
    }

    // スクロール位置を先頭へ初期化
    this.m_table.$el.querySelector('.scroll')!.scrollTop = 0
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
    tableRow.share = { icon: '' }
    if (node.inheritedShare.isPublic) {
      tableRow.share = { icon: 'public' }
    }
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
      share: source.share,
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
    this.$emit(
      'move-selected',
      rows.map(node => node.value)
    )
  }

  private m_dispatchRenameSelected(row: TableRow): void {
    this.$emit('rename-selected', row.value)
  }

  private m_dispatchDeleteSelected(rows: TableRow[]): void {
    this.$emit(
      'delete-selected',
      rows.map(node => node.value)
    )
  }

  private m_dispatchShareSelected(rows: TableRow[]): void {
    this.$emit(
      'share-selected',
      rows.map(node => node.value)
    )
  }

  private m_dispatchReloadSelected(row: TableRow): void {
    this.$emit('reload-selected', row.value)
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
      // ノード詳細ビューを表示
      this.m_nodeDetailView.setNodePath(row.value)
      this.m_detailViewNode = this.treeStore.getNode(row.value)!
    }
  }

  /**
   * ノード詳細ビューが閉じられる際のリスナです。
   */
  private m_nodeDetailViewOnClose() {
    this.m_detailViewNode = null
  }
}
</script>
