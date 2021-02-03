<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.StorageDirPathBreadcrumb
  margin: 16px
  .path-block
    display: inline-block
    @extend %text-subtitle1
    .path-block
      @extend %app-link

.toggle-drawer
  color: $app-link-color

.path-block-btn
  @extend %text-subtitle1
  font-weight: map-get($text-weights, "bold")
  color: $app-link-color
  &.last
    color: $text-primary-color
    pointer-events: none
  &.last.enabled
    color: $app-link-color
    pointer-events: auto

.path-block-dropdown
  color: $app-link-color
  width: 26px

.h-spacer
  width: 10px
</style>

<template>
  <div class="StorageDirPathBreadcrumb layout horizontal center wrap">
    <q-btn class="toggle-drawer" flat padding="xs" icon="menu" @click="toggleDrawerButtonOnClick" />
    <div class="h-spacer" />
    <div v-for="pathBlock of pathBlocks" :key="pathBlock.path" class="path-block">
      <q-btn
        v-if="!pathBlock.last"
        class="path-block-btn"
        flat
        :label="pathBlock.label"
        padding="xs"
        no-caps
        @click="pathBlockOnClick(pathBlock.path)"
      />
      <div v-else class="layout horizontal center wrap">
        <q-btn
          class="path-block-btn last"
          :class="{ enabled: pathBlock.lastEnabled }"
          flat
          :label="pathBlock.label"
          padding="xs"
          no-caps
          @click="pathBlockOnClick(pathBlock.path)"
        />
        <q-btn flat class="StorageDirPathBreadcrumb__q-btn path-block-dropdown" padding="xs" icon="arrow_drop_down">
          <StorageNodePopupMenu :storage-type="storageType" :node="pathBlock" :is-root="pathBlock.isRoot" @select="popupMenuOnNodeAction" />
        </q-btn>
      </div>
      <span v-show="!pathBlock.last" class="app-mx-2">/</span>
    </div>
  </div>
</template>

<script lang="ts">
import { StorageArticleDirType, StorageNode, StorageNodeType, StorageType } from '@/app/service'
import { defineComponent, onMounted, ref } from '@vue/composition-api'
import { StorageNodeActionEvent } from '@/app/views/base/storage/base'
import { StorageNodePopupMenu } from '@/app/views/base/storage/storage-node-popup-menu.vue'
import { StoragePageService } from '@/app/views/base/storage/storage-page-service'
import { splitHierarchicalPaths } from 'web-base-lib'

interface PathBlock {
  label: string
  path: string
  nodeType: StorageNodeType
  last: boolean
  lastEnabled: boolean
  isRoot: boolean
}

interface StorageDirPathBreadcrumb extends StorageDirPathBreadcrumb.Props {
  /**
   * 選択されているノードを設定します。
   * @param selectedNodePath
   */
  setSelectedNode(selectedNodePath: string | null): void
}

namespace StorageDirPathBreadcrumb {
  export interface Props {
    storageType: StorageType
  }

  export const clazz = defineComponent({
    name: 'StorageDirPathBreadcrumb',

    components: {
      StorageNodePopupMenu: StorageNodePopupMenu.clazz,
    },

    props: {
      storageType: { type: String, required: true },
    },

    setup(props: Readonly<Props>, ctx) {
      //----------------------------------------------------------------------
      //
      //  Lifecycle hooks
      //
      //----------------------------------------------------------------------

      onMounted(() => {
        pathBlocks.value = createPathBlocks(null)
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const pageService = StoragePageService.getInstance(props.storageType)

      const pathBlocks = ref<PathBlock[]>([])

      //----------------------------------------------------------------------
      //
      //  Methods
      //
      //----------------------------------------------------------------------

      const setSelectedNode: StorageDirPathBreadcrumb['setSelectedNode'] = selectedNodePath => {
        let selectedNode: StorageNode | null = null
        if (selectedNodePath) {
          selectedNode = pageService.sgetStorageNode({ path: selectedNodePath })
        }
        pathBlocks.value = createPathBlocks(selectedNode)
      }

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      function createPathBlocks(selectedNode: StorageNode | null): PathBlock[] {
        const result: PathBlock[] = []

        if (selectedNode) {
          let dirPath = ''
          switch (selectedNode.nodeType) {
            case StorageNodeType.Dir: {
              dirPath = selectedNode.path
              break
            }
            case StorageNodeType.File: {
              dirPath = selectedNode.dir
              break
            }
          }

          const hierarchicalDirPaths = splitHierarchicalPaths(dirPath)
          const parentNode = pageService.getStorageNode({ path: selectedNode.dir })

          for (let i = 0; i < hierarchicalDirPaths.length; i++) {
            const dirPath = hierarchicalDirPaths[i]
            const dirNode = pageService.sgetStorageNode({ path: dirPath })
            result.push({
              ...dirNode,
              label: pageService.getDisplayNodeName(dirNode),
              last: i === hierarchicalDirPaths.length - 1,
              isRoot: false,
              // 通常、パンくずの最後尾ディレクトリはクリック不可だが、記事ノードの場合は
              // パンくず経由で記事編集画面からディレクトリ一覧画面に戻りたい。
              // 次の記述により、パンくずの最後尾ディレクトリであっても記事ディレクトリの
              // 場合はクリック可能になる。
              lastEnabled: parentNode?.article?.dir?.type === StorageArticleDirType.Article,
            })
          }
        }

        const treeRootNode = pageService.getRootTreeNode()
        result.unshift({
          label: treeRootNode.label,
          path: treeRootNode.value,
          nodeType: treeRootNode.nodeType,
          last: result.length <= 0,
          lastEnabled: false,
          isRoot: true,
        })

        return result
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      /**
       * パンくずのトグルドロワーボタンがクリックされた際のリスナです。
       */
      function toggleDrawerButtonOnClick() {
        ctx.emit('toggle-drawer')
      }

      /**
       * パスのパンくずブロックがクリックされた際のリスナです。
       * @param nodePath
       */
      function pathBlockOnClick(nodePath: string) {
        ctx.emit('select', nodePath)
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
        pathBlocks,
        setSelectedNode,
        toggleDrawerButtonOnClick,
        pathBlockOnClick,
        popupMenuOnNodeAction,
      }
    },
  })
}

export default StorageDirPathBreadcrumb.clazz
export { StorageDirPathBreadcrumb }
</script>
