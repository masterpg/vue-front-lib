<style lang="sass">
@import 'src/app/styles/app.variables'

.StorageDirPathBreadcrumb__q-btn
  &.q-btn .q-icon
    font-size: 1.3em
    color: $grey-6
    &.on-right
      margin-left: 0
</style>

<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.StorageDirPathBreadcrumb
  @extend %layout-horizontal
  @extend %layout-wrap
  margin: 16px
  .path-block
    display: inline-block
    @extend %text-h6
    .path-block
      @extend %app-link

.path-block-btn
  @extend %text-h6
  color: $app-link-color
  &.last
    color: $text-primary-color
</style>

<template>
  <div class="StorageDirPathBreadcrumb">
    <div v-for="pathBlock of pathBlocks" :key="pathBlock.path" class="path-block">
      <q-btn
        v-if="!pathBlock.last"
        flat
        :label="pathBlock.label"
        class="StorageDirPathBreadcrumb__q-btn path-block-btn"
        padding="xs"
        no-caps
        @click="pathBlockOnClick(pathBlock.path)"
      />
      <q-btn
        v-else
        flat
        :label="pathBlock.label"
        class="StorageDirPathBreadcrumb__q-btn path-block-btn last"
        padding="xs"
        no-caps
        icon-right="arrow_drop_down"
      >
        <StorageNodePopupMenu :storage-type="storageType" :node="pathBlock" :is-root="pathBlock.isRoot" @select="popupMenuOnNodeAction" />
      </q-btn>
      <span v-show="!pathBlock.last" class="app-mx-2">/</span>
    </div>
  </div>
</template>

<script lang="ts">
import { StorageNode, StorageNodeType, StorageType } from '@/app/service'
import { computed, defineComponent, onMounted, reactive } from '@vue/composition-api'
import { StorageNodeActionEvent } from '@/app/views/base/storage/base'
import { StorageNodePopupMenu } from '@/app/views/base/storage/storage-node-popup-menu.vue'
import { StoragePageService } from '@/app/views/base/storage/storage-page-service'
import { splitHierarchicalPaths } from 'web-base-lib'

interface PathBlock {
  label: string
  path: string
  nodeType: StorageNodeType
  last: boolean
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
        state.pathBlocks = createPathBlocks(null)
      })

      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const pageService = StoragePageService.getInstance(props.storageType)

      const state = reactive({
        pathBlocks: [] as PathBlock[],
      })

      const pathBlocks = computed({
        get: () => state.pathBlocks,
        set: value => (state.pathBlocks = value),
      })

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

          for (let i = 0; i < hierarchicalDirPaths.length; i++) {
            const dirPath = hierarchicalDirPaths[i]
            const dirNode = pageService.sgetStorageNode({ path: dirPath })
            result.push({
              ...dirNode,
              label: pageService.getDisplayNodeName(dirNode),
              last: i === hierarchicalDirPaths.length - 1,
              isRoot: false,
            })
          }
        }

        const treeRootNode = pageService.getRootTreeNode()
        result.unshift({
          label: treeRootNode.label,
          path: treeRootNode.value,
          nodeType: treeRootNode.nodeType,
          last: result.length <= 0,
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
        pathBlockOnClick,
        popupMenuOnNodeAction,
      }
    },
  })
}

export default StorageDirPathBreadcrumb.clazz
export { StorageDirPathBreadcrumb }
</script>
