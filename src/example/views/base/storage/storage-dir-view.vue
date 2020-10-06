<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.th
  cursor: default
  &.label
    color: $app-link-color
    span
      @extend %app-link
      font-weight: map-get($text-weights, "medium")
      vertical-align: middle
</style>

<template>
  <storage-dir-table
    ref="table"
    :data="m_dirChildNodes"
    :columns="columns"
    :selected.sync="dirSelectedNodes"
    :sort-method="sortChildNodesMethod"
    :loading="loading"
    row-key="label"
  >
    <template v-slot:body="slotProps">
      <q-tr :props="slotProps.tr" @click="m_rowOnClick(slotProps.tr.row)">
        <q-td auto-width>
          <q-checkbox v-model="slotProps.tr.selected" />
        </q-td>
        <q-td key="label" :props="slotProps.tr">
          <span v-if="slotProps.tr.row.isDir" class="th label" @click="m_nameCellOnClick(slotProps.tr.row, $event)">
            <q-icon :name="slotProps.tr.row.icon" size="24px" class="app-mr-6" />
            <span>{{ slotProps.tr.row.label }}</span>
          </span>
          <span v-else-if="slotProps.tr.row.isFile" class="th">
            <q-icon :name="slotProps.tr.row.icon" size="24px" class="app-mr-6" />
            <span>{{ slotProps.tr.row.label }}</span>
          </span>
        </q-td>
        <q-td key="type" :props="slotProps.tr" class="th">{{ slotProps.tr.row.type }}</q-td>
        <q-td key="size" :props="slotProps.tr" class="th">{{ slotProps.tr.row.size }}</q-td>
        <q-td key="share" :props="slotProps.tr" class="th">
          <q-icon :name="slotProps.tr.row.share.icon" size="24px" />
        </q-td>
        <q-td key="updatedAt" :props="slotProps.tr" class="th">{{ slotProps.tr.row.updatedAt }}</q-td>
        <storage-node-popup-menu
          :storage-type="storageType"
          :node="slotProps.tr.row"
          :selected-nodes="table.selected"
          context-menu
          @select="m_popupMenuOnNodeAction"
        />
      </q-tr>
    </template>
  </storage-dir-table>
</template>

<script lang="ts">
import { BaseComponent, NoCache, Resizable } from '@/example/base'
import { StorageArticleNodeType, StorageNode, StorageNodeType, StorageType } from '@/lib'
import { Component } from 'vue-property-decorator'
import { QTableColumn } from 'quasar'
import StorageDirTable from './storage-dir-table.vue'
import { StorageNodeActionEvent } from './base'
import StorageNodePopupMenu from './storage-node-popup-menu.vue'
import { StoragePageMixin } from './storage-page-mixin'
import Vue from 'vue'
import { arrayToDict } from 'web-base-lib'
import bytes from 'bytes'
import { i18n } from '@/example/i18n'
import { mixins } from 'vue-class-component'

export interface IStorageDirView extends Vue {
  /**
   * 選択されているノードを設定します。
   * 選択ノードがディレクトリの場合、そのディレクトリの子ノード一覧が表示されます。
   * 選択ノードがファイルの場合、親となるディレクトリの子ノード一覧が表示され、
   * また選択ノードがアクティブな状態として表示されます。
   * @param selectedNodePath
   */
  setSelectedNode(selectedNodePath: string | null): void

  /**
   * 現在表示されているディレクトリノードです。
   */
  readonly targetDir: StorageNode | null

  /**
   * ビューのローディング状態です。
   */
  loading: boolean
}

@Component
export class StorageDirTableRow extends StoragePageMixin {
  static new(params: { storageType: StorageType; node: StorageNode; table: StorageDirTable }): StorageDirTableRow {
    const CompClass = Vue.extend(StorageDirTableRow)
    return new CompClass({
      data: { node: params.node, table: params.table },
      propsData: { storageType: params.storageType },
    }) as StorageDirTableRow
  }

  protected node: StorageNode = null as any

  protected table: StorageDirTable = null as any

  get icon(): string {
    return this.getNodeIcon(this.node)
  }

  get type(): string {
    switch (this.nodeType) {
      case StorageNodeType.Dir:
        return this.getNodeTypeLabel(this.node)
      case StorageNodeType.File:
        return this.node.contentType
      default:
        return ''
    }
  }

  get label(): string {
    const nodeLabel = this.getDisplayName(this.node)
    return this.node.nodeType === StorageNodeType.Dir ? `${nodeLabel}/` : nodeLabel
  }

  get dir(): string {
    return this.node.dir
  }

  get path(): string {
    return this.node.path
  }

  get name(): string {
    return this.node.name
  }

  get size(): string {
    return this.node.nodeType === StorageNodeType.Dir ? undefined : bytes(this.node.size)
  }

  get share(): { icon: string } {
    if (this.node.share.isPublic === null) {
      if (this.storageLogic.getInheritedShare(this.node.path).isPublic) {
        return { icon: 'public' }
      }
    } else {
      return { icon: this.node.share.isPublic ? 'public' : 'lock' }
    }
    return { icon: '' }
  }

  get updatedAt(): string {
    return String(i18n.d(this.node.updatedAt.toDate(), 'dateTime'))
  }

  get updatedAtNum(): number {
    return this.node.updatedAt.unix()
  }

  get nodeType(): StorageNodeType {
    return this.node.nodeType
  }

  get articleNodeType(): StorageArticleNodeType | null {
    return this.node.articleNodeType
  }

  get articleSortOrder(): number | null {
    return this.node.articleSortOrder
  }

  get isDir(): boolean {
    return this.node.nodeType === StorageNodeType.Dir
  }

  get isFile(): boolean {
    return this.node.nodeType === StorageNodeType.File
  }

  get selected(): boolean {
    if (!this.table.selected) return false
    return this.table.selected.includes(this)
  }

  populate(source: this): void {
    this.node = source.node
  }
}

@Component({
  components: {
    StorageDirTable,
    StorageNodePopupMenu,
  },
})
export default class StorageDirView extends mixins(BaseComponent, Resizable, StoragePageMixin) implements IStorageDirView {
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

  private m_dirPath: string | null = null

  get targetDir(): StorageNode | null {
    if (!this.m_dirPath) return null
    return this.storageLogic.getNode({ path: this.m_dirPath }) || null
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected get columns(): QTableColumn[] {
    return [
      { name: 'label', align: 'left', label: String(this.$t('storage.nodeDetail.name')), field: 'label', sortable: true },
      { name: 'type', align: 'left', label: String(this.$t('storage.nodeDetail.type')), field: 'type', sortable: true },
      { name: 'size', align: 'right', label: String(this.$t('storage.nodeDetail.size')), field: 'size', sortable: true },
      { name: 'share', align: 'center', label: String(this.$t('storage.nodeDetail.share')), field: 'share', sortable: true },
      { name: 'updatedAt', align: 'left', label: String(this.$t('storage.nodeDetail.updatedAt')), field: 'updatedAt', sortable: true },
    ]
  }

  protected dirSelectedNodes: StorageDirTableRow[] = []

  private m_dirChildNodes: StorageDirTableRow[] = []

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

  setSelectedNode(selectedNodePath: string | null): void {
    const clear = () => {
      this.m_dirPath = null
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
    if (this.m_dirPath !== dirPath) {
      // テーブルをクリア
      clear()
    }

    this.m_dirPath = dirPath

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
    return StorageDirTableRow.new({
      storageType: this.storageType,
      node,
      table: this.table,
    })
  }

  /**
   * 子ノードをソートするための関数です。
   * @param rows
   * @param sortBy
   * @param descending
   */
  protected sortChildNodesMethod(rows: StorageDirTableRow[], sortBy: string, descending: boolean): StorageDirTableRow[] {
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
        child.populate(latestChild)
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
   * ポップアップメニューでアクションが選択された際のリスナです。
   * @param e
   */
  private m_popupMenuOnNodeAction(e: StorageNodeActionEvent) {
    this.$emit('node-action', e)
  }
}
</script>
