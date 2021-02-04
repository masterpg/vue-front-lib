<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.StorageDirPathBreadcrumb
  margin: 16px

.toggle-drawer
  color: $app-link-color

.path-block-container
  display: inline-block
  overflow-wrap: anywhere

.path-block
  @extend %app-link
  @extend %text-subtitle1
  &.last
    color: $text-primary-color
    pointer-events: none
    font-weight: map-get($text-weights, "bold")
  &.last.enabled
    color: $app-link-color
    pointer-events: auto

.path-block-menu
  color: $app-link-color
</style>

<template>
  <div class="StorageDirPathBreadcrumb layout horizontal start">
    <q-btn
      v-show="screenSize.gt.sp"
      class="toggle-drawer app-mt-2 app-mr-10"
      flat
      size="md"
      padding="none"
      icon="menu"
      @click="toggleDrawerButtonOnClick"
    />
    <div class="path-block-container">
      <template v-for="pathBlock of pathBlocks">
        <span v-if="!pathBlock.last" :key="`${pathBlock.path}-block`" class="path-block" @click="pathBlockOnClick(pathBlock.path)">{{
          pathBlock.label
        }}</span>
        <template v-else>
          <span
            class="path-block last"
            :key="`${pathBlock.path}-block`"
            :class="{ enabled: pathBlock.lastEnabled }"
            @click="pathBlockOnClick(pathBlock.path)"
            >{{ pathBlock.label }}
          </span>
          <q-btn :key="`${pathBlock.path}}-menu`" class="path-block-menu" flat size="md" padding="none" icon="arrow_drop_down">
            <StorageNodePopupMenu :storage-type="storageType" :node="pathBlock" :is-root="pathBlock.isRoot" @select="popupMenuOnNodeAction" />
          </q-btn>
        </template>
        <span :key="`${pathBlock.path}-slash`" v-show="!pathBlock.last" class="app-mx-6">/</span>
      </template>
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
import { useScreenSize } from '@/app/base'

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

      const screenSize = useScreenSize()

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
        screenSize,
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
