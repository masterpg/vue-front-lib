<style lang="sass">
@import 'src/example/styles/app.variables'

.article-admin-path-breadcrumb__q-btn
  &.q-btn .q-icon
    font-size: 1.3em
    color: $grey-6
    &.on-right
      margin-left: 0
</style>

<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.article-admin-path-breadcrumb-main
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
  <div class="article-admin-path-breadcrumb-main">
    <div v-for="pathBlock of m_pathBlocks" :key="pathBlock.path" class="path-block">
      <q-btn
        v-if="!pathBlock.last"
        flat
        :label="pathBlock.name"
        class="article-admin-path-breadcrumb__q-btn path-block-btn"
        padding="xs"
        no-caps
        @click="m_pathBlockOnClick(pathBlock.path)"
      />
      <q-btn
        v-else
        flat
        :label="pathBlock.name"
        class="article-admin-path-breadcrumb__q-btn path-block-btn last"
        padding="xs"
        no-caps
        icon-right="arrow_drop_down"
      >
        <article-admin-node-popup-menu :node="pathBlock" :is-root="pathBlock.isRoot" @select="m_popupMenuOnNodeAction" />
      </q-btn>
      <span v-show="!pathBlock.last" class="app-mx-8">/</span>
    </div>
  </div>
</template>

<script lang="ts">
import { BaseComponent, Resizable, StorageNodeType } from '@/lib'
import ArticleAdminNodePopupMenu from './article-admin-node-popup-menu.vue'
import { ArticleAdminPageMixin } from './base'
import { Component } from 'vue-property-decorator'
import { StorageNodeActionEvent } from '@/example/views/base/storage'
import { mixins } from 'vue-class-component'
import { splitHierarchicalPaths } from 'web-base-lib'

interface PathBlock {
  name: string
  path: string
  nodeType: StorageNodeType
  last: boolean
  isRoot: boolean
}

@Component({
  components: {
    ArticleAdminNodePopupMenu,
  },
})
export default class ArticleAdminPathBreadcrumb extends mixins(BaseComponent, Resizable, ArticleAdminPageMixin) {
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
   * パンくずに表示するディレクトリパスを設定します。
   * @param dirPath
   */
  setDirPath(dirPath: string | null): void {
    this.m_pathBlocks = this.m_createPathBlocks(dirPath)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_createPathBlocks(dirPath: string | null): PathBlock[] {
    const result: PathBlock[] = []

    if (dirPath) {
      const hierarchicalDirPaths = splitHierarchicalPaths(dirPath)

      for (let i = 0; i < hierarchicalDirPaths.length; i++) {
        const dirPath = hierarchicalDirPaths[i]
        const dirNode = this.storageLogic.sgetNode({ path: dirPath })
        result.push({
          ...dirNode,
          last: i === hierarchicalDirPaths.length - 1,
          isRoot: false,
        })
      }
    }

    const rootNode = this.pageStore.rootNode
    result.unshift({
      name: rootNode.name,
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
