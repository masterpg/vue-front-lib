<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.th-name
  color: $app-link-color
  span
    @extend %app-link
    font-weight: map-get($text-weights, "medium")
    vertical-align: middle
.th-label
  cursor: default
</style>

<template>
  <storage-dir-table
    ref="table"
    :data="m_dirChildNodes"
    :columns="columns"
    :selected.sync="m_dirSelectedNodes"
    :sort-method="sortChildNodesMethod"
    :loading="loading"
    row-key="name"
  >
    <template v-slot:body="slotProps">
      <q-tr :props="slotProps.tr" @click="m_rowOnClick(slotProps.tr.row)">
        <q-td auto-width>
          <q-checkbox v-model="slotProps.tr.selected" />
        </q-td>
        <q-td key="name" :props="slotProps.tr">
          <span v-if="slotProps.tr.row.isDir" class="th-name" @click="m_nameCellOnClick(slotProps.tr.row, $event)">
            <q-icon :name="slotProps.tr.row.icon" size="24px" class="app-mr-6" />
            <span>{{ slotProps.tr.row.name }}</span>
          </span>
          <span v-else-if="slotProps.tr.row.isFile" class="th-label">
            <q-icon :name="slotProps.tr.row.icon" size="24px" class="app-mr-6" />
            <span>{{ slotProps.tr.row.name }}</span>
          </span>
        </q-td>
        <q-td key="contentType" :props="slotProps.tr" class="th-label">{{ slotProps.tr.row.contentType }}</q-td>
        <q-td key="size" :props="slotProps.tr" class="th-label">{{ slotProps.tr.row.size }}</q-td>
        <q-td key="share" :props="slotProps.tr" class="th-label">
          <q-icon :name="slotProps.tr.row.share.icon" size="24px" />
        </q-td>
        <q-td key="updatedAt" :props="slotProps.tr" class="th-label">{{ slotProps.tr.row.updatedAt }}</q-td>
        <storage-node-popup-menu :node="slotProps.tr.row" :selected-nodes="table.selected" context-menu @select="m_popupMenuOnSelect" />
      </q-tr>
    </template>
  </storage-dir-table>
</template>

<script lang="ts">
import { BaseComponent, NoCache, Resizable, StorageNode, StorageNodeType } from '@/lib'
import { StorageNodePopupMenuSelectEvent, StorageTypeMixin } from './base'
import { Component } from 'vue-property-decorator'
import StorageDirTable from './storage-dir-table.vue'
import StorageNodePopupMenu from './storage-node-popup-menu.vue'
import { arrayToDict } from 'web-base-lib'
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
}

@Component({
  components: {
    StorageDirTable,
    StorageNodePopupMenu,
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

  protected selectedNodePath: string | null = null

  private m_dirChildNodes: StorageDirTableRow[] = []

  private m_dirSelectedNodes: StorageDirTableRow[] = []

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
   * 選択されているノードを設定します。
   * 選択ノードがディレクトリの場合、そのディレクトリの子ノード一覧が表示されます。
   * 選択ノードがファイルの場合、親となるディレクトリの子ノード一覧が表示され、
   * また選択ノードがアクティブな状態として表示されます。
   * @param selectedNodePath
   */
  setSelectedNode(selectedNodePath: string | null): void {
    const clear = () => {
      this.selectedNodePath = null
      this.dirPath = null
      this.m_dirChildNodes = []
      // 選択状態を初期化
      this.table.selected && this.table.selected.splice(0)
      // スクロール位置を先頭へ初期化
      this.table.$el.querySelector('.scroll')!.scrollTop = 0
    }

    // 選択ノードにnullが渡された場合、テーブルをクリアして終了
    if (selectedNodePath === null) {
      clear()
      return
    }

    let dirPath!: string
    // 選択ノードがルートノードの場合
    if (!selectedNodePath) {
      dirPath = selectedNodePath
    }
    // 選択ノードがルートノード配下のノードの場合
    else {
      const selectedNode = this.storageLogic.sgetNode({ path: selectedNodePath })
      dirPath = selectedNode.nodeType === StorageNodeType.Dir ? selectedNode.path : selectedNode.dir
    }

    // 前回と今回で対象となるディレクトリが異なる場合
    if (this.dirPath !== dirPath) {
      // テーブルをクリア
      clear()
    }

    this.selectedNodePath = selectedNodePath
    this.dirPath = dirPath

    this.m_buildDirChildNodes(dirPath)
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

  private m_buildDirChildNodes(dirPath: string): void {
    // ロジックストアから最新の子ノードを取得
    const latestChildNodes: StorageDirTableRow[] = []
    const latestChildDict: { [path: string]: StorageDirTableRow } = {}
    for (const child of this.storageLogic.getChildren(dirPath)) {
      const row = this.toTableRow(child)
      latestChildNodes.push(row)
      latestChildDict[row.path] = row
    }

    const childDict = arrayToDict(this.m_dirChildNodes, 'path')

    // 最新データにはないがビューには存在するノードを削除
    for (let i = 0; i < this.m_dirChildNodes.length; i++) {
      const child = this.m_dirChildNodes[i]
      const latestChild = latestChildDict[child.path]
      if (!latestChild) {
        // 最新データにはないノードを削除
        this.m_dirChildNodes.splice(i--, 1)
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
        this.m_dirChildNodes.push(latestChild)
      }
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * テーブル行のがクリックされた際のリスナです。
   * @param row
   */
  m_rowOnClick(row: StorageDirTableRow) {
    this.$emit('select', row.path)
  }

  /**
   * テーブル行の名称セルがクリックされた際のリスナです。
   * @param row
   * @param e
   */
  private m_nameCellOnClick(row: StorageDirTableRow, e: Event) {
    e.stopImmediatePropagation()
    this.$emit('deep-select', row.path)
  }

  /**
   * ポップアップメニューでメニューアイテムが選択された際のリスナです。
   * @param e
   */
  private m_popupMenuOnSelect(e: StorageNodePopupMenuSelectEvent) {
    this.$emit('menu-select', e)
  }
}
</script>
