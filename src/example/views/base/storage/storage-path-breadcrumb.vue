<style lang="sass" scoped>
@import 'src/example/styles/app.variables'

.storage-path-breadcrumb-main
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
  <div class="storage-path-breadcrumb-main">
    <div v-for="pathBlock of m_pathBlocks" :key="pathBlock.label" class="path-block">
      <span v-if="!pathBlock.last" class="path-block" @click="m_pathBlockOnClick(pathBlock.path)">{{ pathBlock.name }}</span>
      <span v-else>{{ pathBlock.name }}</span>
      <span v-show="!pathBlock.last" class="app-mx-8">/</span>
    </div>
  </div>
</template>

<script lang="ts">
import { BaseComponent, Resizable } from '@/lib'
import { Component } from 'vue-property-decorator'
import { StorageTypeMixin } from './base'
import { mixins } from 'vue-class-component'

interface PathBlock {
  name: string
  path: string
  last: boolean
}

@Component
export default class StoragePathBreadcrumb extends mixins(BaseComponent, Resizable, StorageTypeMixin) {
  /**
   * パスのパンくずのブロック配列です。
   */
  private get m_pathBlocks(): PathBlock[] {
    const result: PathBlock[] = []
    const pathBlocks = this.treeStore.selectedNode.value.split('/').filter(item => !!item)

    for (let i = 0; i < pathBlocks.length; i++) {
      const pathBlock = pathBlocks.slice(0, i + 1)
      result.push({
        name: pathBlock[pathBlock.length - 1],
        path: pathBlock.join('/'),
        last: i === pathBlocks.length - 1,
      })
    }

    const rootNode = this.treeStore.rootNode
    result.unshift({
      name: rootNode.label,
      path: rootNode.value,
      last: result.length <= 0,
    })

    return result
  }

  /**
   * パスのパンくずブロックがクリックされた際のリスナです。
   * @param nodePath
   */
  protected m_pathBlockOnClick(nodePath: string) {
    this.$emit('selected', nodePath)
  }
}
</script>
