<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

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
  <div class="StorageDirView">
    <StorageDirTable
      ref="table"
      :data="dirChildNodes"
      :columns="columns"
      :selected.sync="dirSelectedNodes"
      :sort-method="sortChildNodesMethod"
      :loading="loading"
      row-key="id"
    >
      <template v-slot:body="slotProps">
        <q-tr :props="slotProps.tr" @click="rowOnClick(slotProps.tr.row)">
          <q-td auto-width>
            <q-checkbox v-model="slotProps.tr.selected" />
          </q-td>
          <q-td key="label" :props="slotProps.tr">
            <span v-if="slotProps.tr.row.isDir" class="th label" @click="nameCellOnClick(slotProps.tr.row, $event)">
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
          <StorageNodePopupMenu
            :storage-type="storageType"
            :node="slotProps.tr.row"
            :selected-nodes="table.selected"
            context-menu
            @select="popupMenuOnNodeAction"
          />
        </q-tr>
      </template>
    </StorageDirTable>
  </div>
</template>

<script lang="ts">
import { Ref, SetupContext, computed, defineComponent, onMounted, reactive, ref } from '@vue/composition-api'
import { StorageNode, StorageNodeType, StorageType } from '@/app/logic'
import { QTableColumn } from 'quasar'
import { StorageDirTable } from '@/app/views/base/storage/storage-dir-table.vue'
import { StorageNodeActionEvent } from '@/app/views/base/storage/base'
import { StorageNodePopupMenu } from '@/app/views/base/storage/storage-node-popup-menu.vue'
import { StoragePageLogic } from '@/app/views/base/storage/storage-page-logic'
import { arrayToDict } from 'web-base-lib'
import bytes from 'bytes'
import { extendedMethod } from '@/app/base'
import { useI18n } from '@/app/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageDirView extends StorageDirView.Props {
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

interface StorageDirTableRow {
  readonly icon: string
  readonly type: string
  readonly label: string
  readonly id: string
  readonly nodeType: StorageNodeType
  readonly name: string
  readonly dir: string
  readonly path: string
  readonly share: { icon: string }
  readonly size: string
  readonly articleNodeType: StorageNode['articleNodeType']
  readonly articleSortOrder: StorageNode['articleSortOrder']
  readonly isArticleFile: StorageNode['isArticleFile']
  readonly updatedAt: string
  readonly updatedAtNum: number
  readonly isDir: boolean
  readonly isFile: boolean
  readonly selected: boolean
  populate(source: StorageNode): void
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageDirTableRow {
  export function newInstance(params: {
    storageType: StorageType
    node: StorageNode
    table: StorageDirTable<StorageDirTableRow>
  }): StorageDirTableRow {
    const { storageType, table } = params
    const pageLogic = StoragePageLogic.getInstance(storageType)
    const { d } = useI18n()

    const node = reactive({ ...params.node })

    const icon = computed(() => pageLogic.getNodeIcon(node))

    const type = computed(() => {
      switch (nodeType.value) {
        case StorageNodeType.Dir:
          return pageLogic.getNodeTypeLabel(node)
        case StorageNodeType.File:
          return node.contentType
        default:
          return ''
      }
    })

    const label = computed(() => {
      const nodeLabel = pageLogic.getDisplayNodeName(node)
      return nodeType.value === StorageNodeType.Dir ? `${nodeLabel}/` : nodeLabel
    })

    const id = computed(() => node.id)

    const nodeType = computed(() => node.nodeType)

    const name = computed(() => node.name)

    const dir = computed(() => node.dir)

    const path = computed(() => node.path)

    const share = computed(() => {
      if (node.share.isPublic === null) {
        if (pageLogic.getInheritedShare(node.path).isPublic) {
          return { icon: 'public' }
        }
      } else {
        return { icon: node.share.isPublic ? 'public' : 'lock' }
      }
      return { icon: '' }
    })

    const size = computed(() => {
      return nodeType.value === StorageNodeType.Dir ? '' : bytes(node.size)
    })

    const articleNodeType = computed(() => node.articleNodeType)

    const articleSortOrder = computed(() => node.articleSortOrder)

    const isArticleFile = computed(() => node.isArticleFile)

    const updatedAt = computed(() => String(d(node.updatedAt.toDate(), 'dateTime')))

    const updatedAtNum = computed(() => node.updatedAt.unix())

    const isDir = computed(() => nodeType.value === StorageNodeType.Dir)

    const isFile = computed(() => nodeType.value === StorageNodeType.File)

    const selected = computed<boolean>(() => {
      if (!table.selected) return false
      return Boolean(table.selected.find(row => row.id === id.value))
    })

    const populate: StorageDirTableRow['populate'] = source => {
      Object.assign(node, source)
    }

    return reactive({
      icon,
      type,
      label,
      id,
      nodeType,
      name,
      dir,
      path,
      share,
      size,
      articleNodeType,
      articleSortOrder,
      isArticleFile,
      updatedAt,
      updatedAtNum,
      isDir,
      isFile,
      selected,
      populate,
    })
  }
}

namespace StorageDirView {
  export interface Props {
    storageType: StorageType
  }

  export const props = {
    storageType: { type: String, required: true },
  }

  export const clazz = defineComponent({
    name: 'StorageDirView',

    components: {
      StorageDirTable: StorageDirTable.clazz,
      StorageNodePopupMenu: StorageNodePopupMenu.clazz,
    },

    props,

    setup: (props: Readonly<Props>, ctx) => setup(props, ctx),
  })

  export function setup(props: Readonly<Props>, ctx: SetupContext) {
    //----------------------------------------------------------------------
    //
    //  Lifecycle hooks
    //
    //----------------------------------------------------------------------

    onMounted(() => {
      const labelCol = columns.value[0]
      table.value!.sort(labelCol)
    })

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const table = ref<StorageDirTable<StorageDirTableRow>>()

    const pageLogic = StoragePageLogic.getInstance(props.storageType)
    const { t } = useI18n()

    const state = reactive({
      loading: false,
      dirPath: null as string | null,
    })

    const dirSelectedNodes: Ref<StorageDirTableRow[]> = ref([])

    const dirChildNodes: Ref<StorageDirTableRow[]> = ref([])

    const targetDir = computed(() => {
      if (!state.dirPath) return null
      return pageLogic.getStorageNode({ path: state.dirPath }) ?? null
    })

    const columns: Ref<QTableColumn[]> = ref([
      { name: 'label', align: 'left', label: String(t('storage.nodeDetail.name')), field: 'label', sortable: true },
      { name: 'type', align: 'left', label: String(t('storage.nodeDetail.type')), field: 'type', sortable: true },
      { name: 'size', align: 'right', label: String(t('storage.nodeDetail.size')), field: 'size', sortable: true },
      { name: 'share', align: 'center', label: String(t('storage.nodeDetail.share')), field: 'share', sortable: true },
      { name: 'updatedAt', align: 'left', label: String(t('storage.nodeDetail.updatedAt')), field: 'updatedAt', sortable: true },
    ])

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const loading = computed({
      get: () => state.loading,
      set: value => (state.loading = value),
    })

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const setSelectedNode: StorageDirView['setSelectedNode'] = selectedNodePath => {
      const clear = () => {
        state.dirPath = null
        dirChildNodes.value.splice(0)
        // 選択状態を初期化
        table.value!.selected && table.value!.selected.splice(0)
        // スクロール位置を先頭へ初期化
        table.value!.setScrollTop(0)
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
        const selectedNode = pageLogic.sgetStorageNode({ path: selectedNodePath })
        dirPath = selectedNode.nodeType === StorageNodeType.Dir ? selectedNode.path : selectedNode.dir
      }

      // 前回と今回で対象となるディレクトリが異なる場合
      if (state.dirPath !== dirPath) {
        // テーブルをクリア
        clear()
      }

      state.dirPath = dirPath

      buildDirChildNodes(dirPath)
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
    function toTableRow(node: StorageNode): StorageDirTableRow {
      return StorageDirTableRow.newInstance({
        storageType: props.storageType,
        node,
        table: table.value!,
      })
    }

    /**
     * 子ノードをソートするための関数です。
     * @param rows
     * @param sortBy
     * @param descending
     */
    const sortChildNodesMethod = extendedMethod<
      (rows: StorageDirTableRow[], sortBy: 'label' | 'type' | 'size' | 'share' | 'updatedAt', descending: boolean) => StorageDirTableRow[]
    >((rows, sortBy, descending) => {
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
    })

    function buildDirChildNodes(dirPath: string): void {
      // ロジックストアから最新の子ノードを取得
      const latestChildNodes: StorageNode[] = []
      const latestChildDict: { [path: string]: StorageNode } = {}
      for (const child of pageLogic.getStorageChildren(dirPath)) {
        latestChildNodes.push(child)
        latestChildDict[child.path] = child
      }

      const childDict = arrayToDict(dirChildNodes.value, 'path')

      // 最新データにはないがビューには存在するノードを削除
      for (let i = 0; i < dirChildNodes.value.length; i++) {
        const child = dirChildNodes.value[i]
        const latestChild = latestChildDict[child.path]
        if (!latestChild) {
          // 最新データにはないビューノードを削除
          dirChildNodes.value.splice(i--, 1)
          delete childDict[child.path]
          // 選択ノードを格納している配列から最新データにないビューノードを削除
          if (table.value!.selected) {
            const selectedIndex = table.value!.selected.findIndex((row: StorageDirTableRow) => {
              return row.path === child.path
            })
            selectedIndex >= 0 && table.value!.selected.splice(selectedIndex, 1)
          }
        }
      }

      // 最新データをビューに反映
      for (const latestChild of latestChildNodes) {
        const child = childDict[latestChild.path]
        if (child) {
          child.populate(latestChild)
        } else {
          const row = toTableRow(latestChild)
          dirChildNodes.value.push(row)
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
    function rowOnClick(row: StorageDirTableRow) {
      ctx.emit('select', row.path)
    }

    /**
     * テーブル行の名称セルがクリックされた際のリスナです。
     * @param row
     * @param e
     */
    function nameCellOnClick(row: StorageDirTableRow, e: Event) {
      e.stopImmediatePropagation()
      ctx.emit('deep-select', row.path)
    }

    /**
     * ポップアップメニューでアクションが選択された際のリスナです。
     * @param e
     */
    function popupMenuOnNodeAction(e: StorageNodeActionEvent) {
      ctx.emit('node-action', e)
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      table,
      state,
      targetDir,
      columns,
      dirSelectedNodes,
      dirChildNodes,
      loading,
      setSelectedNode,
      sortChildNodesMethod,
      rowOnClick,
      nameCellOnClick,
      popupMenuOnNodeAction,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export default StorageDirView.clazz
export { StorageDirView, StorageDirTableRow }
</script>
