<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.th
  cursor: default
  &.label
    white-space: normal
    > i
      margin-right: 10px
    > div
      min-width: 250px
      > span
        pointer-events: none
  &.label.link
    > i
      color: $app-link-color
    > div
      > span
        pointer-events: unset
        @extend %app-link
        font-weight: map-get($text-weights, "medium")
</style>

<template>
  <div class="StorageDirView">
    <storage-dir-table
      ref="table"
      :data="rows"
      :columns="columns"
      :selected.sync="selectedRows"
      :sort-method="sortMethod"
      :loading="loading"
      row-key="id"
    >
      <template v-slot:body="slotProps">
        <q-tr :props="slotProps.tr" @click="rowOnClick(slotProps.tr.row)">
          <q-td auto-width>
            <q-checkbox v-model="slotProps.tr.selected" />
          </q-td>
          <q-td key="label" :props="slotProps.tr">
            <div class="th label layout horizontal center" :class="{ link: slotProps.tr.row.isDir }">
              <q-icon :name="slotProps.tr.row.icon" :size="slotProps.tr.row.iconSize" />
              <div>
                <span @click="nameCellOnClick(slotProps.tr.row, $event)">{{ slotProps.tr.row.label }}</span>
              </div>
            </div>
          </q-td>
          <q-td key="type" :props="slotProps.tr" class="th">{{ slotProps.tr.row.type }}</q-td>
          <q-td key="size" :props="slotProps.tr" class="th">{{ slotProps.tr.row.size }}</q-td>
          <q-td key="share" :props="slotProps.tr" class="th">
            <q-icon :name="slotProps.tr.row.share.icon" :size="slotProps.tr.row.share.iconSize" />
          </q-td>
          <q-td key="updatedAt" :props="slotProps.tr" class="th">{{ slotProps.tr.row.updatedAt }}</q-td>
          <storage-node-popup-menu
            :storage-type="storageType"
            :node="slotProps.tr.row"
            :selected-nodes="table.selected"
            context-menu
            @select="popupMenuOnNodeAction"
          />
        </q-tr>
      </template>
    </storage-dir-table>
  </div>
</template>

<script lang="ts">
import { Ref, SetupContext, computed, defineComponent, onMounted, reactive, ref } from '@vue/composition-api'
import { StorageArticleSettings, StorageNode, StorageNodeType, StorageType } from '@/app/service'
import { extendedMethod, isFontAwesome } from '@/app/base'
import { QTable } from 'quasar'
import { StorageDirTable } from '@/app/views/base/storage/storage-dir-table.vue'
import { StorageNodeActionEvent } from '@/app/views/base/storage/base'
import { StorageNodePopupMenu } from '@/app/views/base/storage/storage-node-popup-menu.vue'
import { StoragePageService } from '@/app/views/base/storage/storage-page-service'
import { arrayToDict } from 'web-base-lib'
import bytes from 'bytes'
import { useI18n } from '@/app/i18n'
type QTableColumn = NonNullable<QTable['columns']>[number]

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
  readonly article?: StorageArticleSettings
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
    const pageService = StoragePageService.getInstance(storageType)
    const i18n = useI18n()

    const node = reactive({ ...params.node })

    const icon = computed(() => pageService.getNodeIcon(node))

    const iconSize = computed(() => {
      return isFontAwesome(icon.value) ? '20px' : '24px'
    })

    const type = computed(() => {
      switch (nodeType.value) {
        case 'Dir':
          return pageService.getNodeTypeLabel(node)
        case 'File':
          return node.contentType
        default:
          return ''
      }
    })

    const label = computed(() => {
      const nodeLabel = pageService.getDisplayNodeName(node)
      return nodeType.value === 'Dir' ? `${nodeLabel}/` : nodeLabel
    })

    const id = computed(() => node.id)

    const nodeType = computed(() => node.nodeType)

    const name = computed(() => node.name)

    const dir = computed(() => node.dir)

    const path = computed(() => node.path)

    const share = computed(() => {
      let icon = ''
      if (node.share.isPublic === null) {
        if (pageService.getInheritedShare(node.path).isPublic) {
          icon = 'public'
        }
      } else {
        icon = node.share.isPublic ? 'public' : 'lock'
      }
      return { icon, iconSize: isFontAwesome(icon) ? '20px' : '24px' }
    })

    const size = computed(() => {
      return nodeType.value === 'Dir' ? '' : bytes(node.size)
    })

    const article = computed(() => node.article)

    const updatedAt = computed(() => String(i18n.d(node.updatedAt.toDate(), 'dateTime')))

    const updatedAtNum = computed(() => node.updatedAt.unix())

    const isDir = computed(() => nodeType.value === 'Dir')

    const isFile = computed(() => nodeType.value === 'File')

    const selected = computed<boolean>(() => {
      if (!table.selected) return false
      return Boolean(table.selected.find(row => row.id === id.value))
    })

    const populate: StorageDirTableRow['populate'] = source => {
      Object.assign(node, source)
    }

    return reactive({
      icon,
      iconSize,
      type,
      label,
      id,
      nodeType,
      name,
      dir,
      path,
      share,
      size,
      article,
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

    const pageService = StoragePageService.getInstance(props.storageType)
    const i18n = useI18n()

    const state = reactive({
      loading: false,
      dirPath: null as string | null,
    })

    const columns: Ref<QTableColumn[]> = ref([
      { name: 'label', align: 'left', label: String(i18n.t('storage.nodeDetail.name')), field: 'label', sortable: true },
      { name: 'type', align: 'left', label: String(i18n.t('storage.nodeDetail.type')), field: 'type', sortable: true },
      { name: 'size', align: 'right', label: String(i18n.t('storage.nodeDetail.size')), field: 'size', sortable: true },
      { name: 'share', align: 'center', label: String(i18n.t('storage.nodeDetail.share')), field: 'share', sortable: true },
      { name: 'updatedAt', align: 'left', label: String(i18n.t('storage.nodeDetail.updatedAt')), field: 'updatedAt', sortable: true },
    ])

    const rows: Ref<StorageDirTableRow[]> = ref([])

    const selectedRows: Ref<StorageDirTableRow[]> = ref([])

    const targetDir = computed(() => {
      if (typeof state.dirPath !== 'string') return null
      return pageService.getStorageNode({ path: state.dirPath }) ?? null
    })

    const filteredSortedRows = computed<StorageDirTableRow[]>(() => table.value!.filteredSortedRows)

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
      // 選択ノードにnullが渡された場合
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
        const selectedNode = pageService.sgetStorageNode({ path: selectedNodePath })
        dirPath = selectedNode.nodeType === 'Dir' ? selectedNode.path : selectedNode.dir
      }

      // 前回と今回で対象となるディレクトリが異なる場合
      if (state.dirPath !== dirPath) {
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

    const clear = extendedMethod(() => {
      state.dirPath = null
      rows.value.splice(0)
      // 選択状態を初期化
      table.value!.selected && table.value!.selected.splice(0)
      // スクロール位置を先頭へ初期化
      table.value!.setScrollTop(0)
    })

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
    const sortMethod = extendedMethod<StorageDirTable.SortMethod<StorageDirTableRow>>((rows, sortBy, descending) => {
      const data = [...rows]
      const sortBy_: 'label' | 'type' | 'size' | 'share' | 'updatedAt' = sortBy as any

      if (sortBy_) {
        data.sort((a, b) => {
          const x = descending ? b : a
          const y = descending ? a : b

          if (sortBy_ === 'label') {
            if (x.nodeType === 'Dir' && y.nodeType === 'File') {
              return -1
            } else if (x.nodeType === 'File' && y.nodeType === 'Dir') {
              return 1
            }
            return x[sortBy_] > y[sortBy_] ? 1 : x[sortBy_] < y[sortBy_] ? -1 : 0
          } else if (sortBy_ === 'updatedAt') {
            return x.updatedAtNum - y.updatedAtNum
          } else {
            return x[sortBy_] > y[sortBy_] ? 1 : x[sortBy_] < y[sortBy_] ? -1 : 0
          }
        })
      }

      return data
    })

    function buildDirChildNodes(dirPath?: string): void {
      // ストアから最新の子ノードを取得
      const latestChildNodes: StorageNode[] = []
      const latestChildDict: { [path: string]: StorageNode } = {}
      for (const child of pageService.getStorageChildren(dirPath)) {
        latestChildNodes.push(child)
        latestChildDict[child.path] = child
      }

      const childDict = arrayToDict(rows.value, 'path')

      // 最新データにはないがビューには存在するノードを削除
      for (let i = 0; i < rows.value.length; i++) {
        const child = rows.value[i]
        const latestChild = latestChildDict[child.path]
        if (!latestChild) {
          // 最新データにはないビューノードを削除
          rows.value.splice(i--, 1)
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
          rows.value.push(row)
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
      columns,
      rows,
      selectedRows,
      targetDir,
      filteredSortedRows,
      loading,
      setSelectedNode,
      clear,
      sortMethod,
      buildDirChildNodes,
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
