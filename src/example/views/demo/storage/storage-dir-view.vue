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
        <span :class="{ 'path-block': !pathBlock.last }" @click="m_pathBlockOnClick(pathBlock.path)">{{ pathBlock.name }}</span>
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
        binary-state-sort
        row-key="label"
        hide-bottom
        flat
        class="storage-dir-children-view__table"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="label" :props="props">
              <span class="label" @click="m_tableRowNameCellOnClick(props.row)">
                <q-icon :name="props.row.icon" size="24px" class="app-mr-6" />
                <span>{{ props.row.label }}</span>
              </span>
            </q-td>
            <q-td key="updated" :props="props">{{ props.row.updated }}</q-td>
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
import { router } from '@/example/router'
import { storageTreeStore } from '@/example/views/demo/storage/storage-tree-store'

interface TableRow {
  nodeType: StorageNodeType
  label: string
  value: string
  icon: string
  updated: string
  updatedNum: number
}

@Component({
  components: {},
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
        this.m_children.splice(i--, 1)
        delete this.m_childMap[child.value]
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
    return {
      nodeType: node.nodeType as StorageNodeType,
      label: node.nodeType === StorageNodeType.Dir ? `${node.label}/` : node.label,
      value: node.value,
      icon: node.nodeType === StorageNodeType.Dir ? 'folder' : 'description',
      updated: String(this.$d(node.updatedDate.toDate(), 'dateTime')),
      updatedNum: node.updatedDate.unix(),
    }
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
    router.views.demo.storage.move(path)
  }

  /**
   * テーブル行の名称セルがクリックされた際のハンドラです。
   * @param row
   */
  private m_tableRowNameCellOnClick(row: TableRow) {
    router.views.demo.storage.move(row.value)
  }
}
</script>
