<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.th-name
  color: $app-link-color
  span
    @extend %app-link
    font-weight: map-get($text-weights, "medium")
    vertical-align: middle
    &.active
      color: var(--comp-tree-selected-color, $pink-5)
</style>

<template>
  <storage-dir-table
    ref="table"
    :data="m_childNodes"
    :columns="columns"
    :selected.sync="m_selectedNodes"
    :sort-method="sortChildNodesMethod"
    :loading="loading"
    row-key="name"
  >
    <template v-slot:body="slotProps">
      <q-tr :props="slotProps.tr">
        <q-td auto-width>
          <q-checkbox v-model="slotProps.tr.selected" />
        </q-td>
        <q-td key="name" :props="slotProps.tr">
          <span class="th-name" @click="m_nameCellOnClick(slotProps.tr.row)">
            <q-icon :name="slotProps.tr.row.icon" size="24px" class="app-mr-6" />
            <span :class="{ active: slotProps.tr.row.isActive }">{{ slotProps.tr.row.name }}</span>
          </span>
        </q-td>
        <q-td key="contentType" :props="slotProps.tr">{{ slotProps.tr.row.contentType }}</q-td>
        <q-td key="size" :props="slotProps.tr">{{ slotProps.tr.row.size }}</q-td>
        <q-td key="share" :props="slotProps.tr">
          <q-icon :name="slotProps.tr.row.share.icon" size="24px" />
        </q-td>
        <q-td key="updatedAt" :props="slotProps.tr">{{ slotProps.tr.row.updatedAt }}</q-td>
        <storage-node-context-menu :node="slotProps.tr.row" :selected-nodes="table.selected" @select="m_contextMenuOnSelect" />
      </q-tr>
    </template>
  </storage-dir-table>
</template>

<script lang="ts">
import { BaseComponent, NoCache, Resizable, StorageNode, StorageNodeType } from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import { StorageNodeContextMenuSelectedEvent, StorageTypeMixin } from './base'
import { arrayToDict, removeBothEndsSlash } from 'web-base-lib'
import StorageDirTable from './storage-dir-table.vue'
import StorageNodeContextMenu from './storage-node-context-menu.vue'
import bytes from 'bytes'
import { mixins } from 'vue-class-component'

export class StorageDirTableRow {
  constructor(private m_table: StorageDirTable) {}

  nodeType!: StorageNodeType

  name!: string

  path!: string

  icon!: string

  contentType!: string

  size?: number

  share!: {
    icon: string
  }

  updatedAt!: string

  updatedAtNum!: number

  isActive!: boolean

  get selected(): boolean {
    if (!this.m_table.selected) return false
    return this.m_table.selected.includes(this)
  }
}

@Component({
  components: {
    StorageDirTable,
    StorageNodeContextMenu,
  },
})
export default class StorageDirView extends mixins(BaseComponent, Resizable, StorageTypeMixin) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    const labelCol = this.columns[0]
    this.table.sort(labelCol)
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

  protected get columns() {
    return [
      { name: 'name', align: 'left', label: this.$t('storage.nodeDetail.name'), field: 'name', sortable: true },
      { name: 'contentType', align: 'left', label: this.$t('storage.nodeDetail.type'), field: 'contentType', sortable: true },
      { name: 'size', align: 'right', label: this.$t('storage.nodeDetail.size'), field: 'size', sortable: true },
      { name: 'share', align: 'center', label: this.$t('storage.nodeDetail.share'), field: 'share', sortable: true },
      { name: 'updatedAt', align: 'left', label: this.$t('storage.nodeDetail.updatedAt'), field: 'updatedAt', sortable: true },
    ]
  }

  protected dirPath: string | null = null

  private m_childNodes: StorageDirTableRow[] = []

  private m_selectedNodes: StorageDirTableRow[] = []

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  protected get table(): StorageDirTable {
    return this.$refs.table as StorageDirTable
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
      this.m_childNodes = []
      // 選択状態を初期化
      this.table.selected && this.table.selected.splice(0)
      // スクロール位置を先頭へ初期化
      this.table.$el.querySelector('.scroll')!.scrollTop = 0
    }

    // 文字列以外が渡された場合、テーブルをクリアして終了
    if (typeof dirPath !== 'string') {
      clear()
      return
    }

    dirPath = removeBothEndsSlash(dirPath)

    // 前回と今回で設定されるディレクトリパスが異なる場合
    if (this.dirPath !== dirPath) {
      // テーブルをクリア
      clear()
    }

    this.dirPath = dirPath

    this.m_buildChildren()
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * `StorageNode`を`StorageDirTableRow`へ変換します。
   * @param node
   */
  protected toTableRow(node: StorageNode): StorageDirTableRow {
    const tableRow = new StorageDirTableRow(this.table)
    tableRow.nodeType = node.nodeType as StorageNodeType
    tableRow.name = node.nodeType === StorageNodeType.Dir ? `${node.name}/` : node.name
    tableRow.path = node.path
    tableRow.icon = node.nodeType === StorageNodeType.Dir ? 'folder' : 'description'
    tableRow.contentType = node.contentType
    tableRow.size = node.nodeType === StorageNodeType.Dir ? undefined : bytes(node.size)
    tableRow.share = { icon: '' }
    if (node.share.isPublic === null) {
      if (this.storageLogic.getInheritedShare(node.path).isPublic) {
        tableRow.share = { icon: 'public' }
      }
    } else {
      tableRow.share = { icon: node.share.isPublic ? 'public' : 'lock' }
    }
    tableRow.updatedAt = String(this.$d(node.updatedAt.toDate(), 'dateTime'))
    tableRow.updatedAtNum = node.updatedAt.unix()
    tableRow.isActive = this.selectedTreeNode ? this.selectedTreeNode.path === node.path : false
    return tableRow
  }

  /**
   * 引数の`source`から`dest`へデータを投入します。
   * @param source
   * @param dest
   */
  protected populateTableRow(source: StorageDirTableRow, dest: StorageDirTableRow): StorageDirTableRow {
    return Object.assign(dest, {
      name: source.name,
      path: source.path,
      share: source.share,
      updatedAt: source.updatedAt,
      isActive: source.isActive,
    })
  }

  /**
   * 子ノードをソートするための関数です。
   * @param rows
   * @param sortBy
   * @param descending
   */
  protected sortChildNodesMethod(rows: StorageDirTableRow[], sortBy: string, descending: boolean) {
    const data = [...rows]

    if (sortBy) {
      data.sort((a, b) => {
        const x = descending ? b : a
        const y = descending ? a : b

        if (sortBy === 'name') {
          if (x.nodeType === StorageNodeType.Dir && y.nodeType === StorageNodeType.File) {
            return -1
          } else if (x.nodeType === StorageNodeType.File && y.nodeType === StorageNodeType.Dir) {
            return 1
          }
          return x[sortBy] > y[sortBy] ? 1 : x[sortBy] < y[sortBy] ? -1 : 0
        } else if (sortBy === 'updatedAt') {
          return x.updatedAtNum - y.updatedAtNum
        } else {
          return x[sortBy] > y[sortBy] ? 1 : x[sortBy] < y[sortBy] ? -1 : 0
        }
      })
    }

    return data
  }

  private m_buildChildren(): void {
    if (this.dirPath) {
      const dirNode = this.storageLogic.getNode({ path: this.dirPath })
      if (!dirNode) {
        throw new Error(`'storageLogic' does not have specified path's node: '${this.dirPath}'`)
      }
    }

    // ロジックストアから最新の子ノードを取得
    const latestChildNodes: StorageDirTableRow[] = []
    const latestChildDict: { [path: string]: StorageDirTableRow } = {}
    for (const child of this.storageLogic.getChildren(this.dirPath || '')) {
      const row = this.toTableRow(child)
      latestChildNodes.push(row)
      latestChildDict[row.path] = row
    }

    const childDict: { [path: string]: StorageDirTableRow } = arrayToDict(this.m_childNodes, 'path')

    // 最新データにはないがビューには存在するノードを削除
    for (let i = 0; i < this.m_childNodes.length; i++) {
      const child = this.m_childNodes[i]
      const latestChild = latestChildDict[child.path]
      if (!latestChild) {
        // 最新データにはないノードを削除
        this.m_childNodes.splice(i--, 1)
        delete childDict[child.path]
        // 選択ノードを格納している配列から最新データにないノードを削除
        if (this.table.selected) {
          const selectedIndex = this.table.selected.findIndex((row: StorageDirTableRow) => {
            return row.path === child.path
          })
          selectedIndex >= 0 && this.table.selected.splice(selectedIndex, 1)
        }
      }
    }

    // 最新データをビューに反映
    for (const latestChild of latestChildNodes) {
      const child = childDict[latestChild.path]
      if (child) {
        this.populateTableRow(latestChild, child)
      } else {
        this.m_childNodes.push(latestChild)
      }
    }
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
  private m_nameCellOnClick(row: StorageDirTableRow) {
    this.$emit('select', row.path)
  }

  /**
   * コンテキストメニューでメニューアイテムが選択された際のリスナです。
   * @param e
   */
  private m_contextMenuOnSelect(e: StorageNodeContextMenuSelectedEvent) {
    this.$emit('context-menu-select', e)
  }
}
</script>
