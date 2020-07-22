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
</style>

<template>
  <div class="storage-dir-path-breadcrumb-main">
    <div v-for="pathBlock of m_pathBlocks" :key="pathBlock.path" class="path-block">
      <span v-if="!pathBlock.last" class="path-block" @click="m_pathBlockOnClick(pathBlock.path)">{{ pathBlock.name }}</span>
      <span v-else>{{ pathBlock.name }}</span>
      <span v-show="!pathBlock.last" class="app-mx-8">/</span>
    </div>
  </div>
</template>

<script lang="ts">
import { BaseComponent, Resizable, StorageNodeType } from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import { StorageTreeNode, StorageTypeMixin } from './base'
import { mixins } from 'vue-class-component'

interface PathBlock {
  name: string
  path: string
  last: boolean
}

@Component
export default class StorageDirPathBreadcrumb extends mixins(BaseComponent, Resizable, StorageTypeMixin) {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ required: true })
  selectedNode!: StorageTreeNode | null

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  get m_rootNode(): StorageTreeNode | null {
    if (!this.selectedNode) return null
    return this.selectedNode.getRootNode()!
  }

  /**
   * パスのパンくずのブロック配列です。
   */
  private get m_pathBlocks(): PathBlock[] {
    if (!this.selectedNode) return []
    if (!this.m_rootNode) return []

    const result: PathBlock[] = []

    let dirPath = ''
    switch (this.selectedNode.nodeType) {
      case StorageNodeType.Dir: {
        dirPath = this.selectedNode.path
        break
      }
      case StorageNodeType.File: {
        dirPath = this.selectedNode.parent!.value
        break
      }
    }

    const pathBlocks = dirPath.split('/').filter(item => !!item)

    for (let i = 0; i < pathBlocks.length; i++) {
      const pathBlock = pathBlocks.slice(0, i + 1)
      result.push({
        name: pathBlock[pathBlock.length - 1],
        path: pathBlock.join('/'),
        last: i === pathBlocks.length - 1,
      })
    }

    result.unshift({
      name: this.m_rootNode.name,
      path: this.m_rootNode.path,
      last: result.length <= 0,
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
}
</script>
