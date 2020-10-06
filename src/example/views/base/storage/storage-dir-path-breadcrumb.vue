<style lang="sass">
@import 'src/example/styles/app.variables'

.storage-dir-path-breadcrumb__q-btn
  &.q-btn .q-icon
    font-size: 1.3em
    color: $grey-6
    &.on-right
      margin-left: 0
</style>

<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.storage-dir-path-breadcrumb-main
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
  <div class="storage-dir-path-breadcrumb-main">
    <div v-for="pathBlock of m_pathBlocks" :key="pathBlock.path" class="path-block">
      <q-btn
        v-if="!pathBlock.last"
        flat
        :label="pathBlock.label"
        class="storage-dir-path-breadcrumb__q-btn path-block-btn"
        padding="xs"
        no-caps
        @click="m_pathBlockOnClick(pathBlock.path)"
      />
      <q-btn
        v-else
        flat
        :label="pathBlock.label"
        class="storage-dir-path-breadcrumb__q-btn path-block-btn last"
        padding="xs"
        no-caps
        icon-right="arrow_drop_down"
      >
        <storage-node-popup-menu :storage-type="storageType" :node="pathBlock" :is-root="pathBlock.isRoot" @select="m_popupMenuOnNodeAction" />
      </q-btn>
      <span v-show="!pathBlock.last" class="app-mx-8">/</span>
    </div>
  </div>
</template>

<script lang="ts">
import { BaseComponent, Resizable } from '@/example/base'
import { StorageNode, StorageNodeType } from '@/example/logic'
import { Component } from 'vue-property-decorator'
import { StorageNodeActionEvent } from './base'
import StorageNodePopupMenu from './storage-node-popup-menu.vue'
import { StoragePageMixin } from './storage-page-mixin'
import { mixins } from 'vue-class-component'
import { splitHierarchicalPaths } from 'web-base-lib'

interface PathBlock {
  label: string
  path: string
  nodeType: StorageNodeType
  last: boolean
  isRoot: boolean
}

@Component({
  components: { StorageNodePopupMenu },
})
export default class StorageDirPathBreadcrumb extends mixins(BaseComponent, Resizable, StoragePageMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  mounted() {
    this.m_pathBlocks = this.m_createPathBlocks(null)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_pathBlocks: PathBlock[] = []

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * 選択されているノードを設定します。
   * @param selectedNodePath
   */
  setSelectedNode(selectedNodePath: string | null): void {
    let selectedNode: StorageNode | null = null
    if (selectedNodePath) {
      selectedNode = this.storageLogic.sgetNode({ path: selectedNodePath })
    }
    this.m_pathBlocks = this.m_createPathBlocks(selectedNode)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_createPathBlocks(selectedNode: StorageNode | null): PathBlock[] {
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
        const dirNode = this.storageLogic.sgetNode({ path: dirPath })
        result.push({
          ...dirNode,
          label: this.getDisplayName(dirNode),
          last: i === hierarchicalDirPaths.length - 1,
          isRoot: false,
        })
      }
    }

    const rootNode = this.pageStore.rootNode
    result.unshift({
      label: rootNode.label,
      path: rootNode.path,
      nodeType: rootNode.nodeType,
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
  protected m_pathBlockOnClick(nodePath: string) {
    this.$emit('select', nodePath)
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
