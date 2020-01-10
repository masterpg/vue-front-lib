<style lang="sass" scoped>
@import '../../../styles/lib.variables'

.node-container
  padding-top: var(--comp-tree-distance, 6px)
  &.eldest
    padding-top: 0

.icon-container
  @extend %layout-horizontal
  @extend %layout-center-center
  min-width: 1.5em
  max-width: 1.5em
  height: 1.5em
  margin-right: 6px
  .toggle-icon
    transition: transform .5s
    cursor: pointer

.item-container
  height: var(--comp-tree-line-height, 26px)
  cursor: pointer
  white-space: nowrap
  &:hover
    .item
      text-decoration: underline
  &.selected
    .item
      color: var(--comp-tree-selected-color, $pink-5)
  &.unselectable
    cursor: default
    .item
      color: var(--comp-tree-unselectable-color, $grey-9)
    &:hover
      .item
        text-decoration: none

.child-container
  padding-left: var(--comp-tree-indent, 16px)
  height: 0
  overflow: hidden
</style>

<template>
  <div>
    <!-- 自ノード -->
    <div ref="nodeContainer" class="node-container layout horizontal center" :class="{ eldest: isEldest }">
      <!-- トグルアイコン有り -->
      <div v-if="hasChildren" class="icon-container">
        <q-icon name="arrow_right" size="26px" color="grey-6" class="toggle-icon" :class="[opened ? 'rotate-90' : '']" @click="toggleIconOnClick" />
      </div>
      <!-- トグルアイコン無し -->
      <div v-else class="icon-container">
        <q-icon name="" size="26px" />
      </div>

      <!-- アイテムコンテナ -->
      <div class="layout horizontal center item-container" :class="{ selected, unselectable }" @click="itemContainerOnClick">
        <!-- 指定アイコン -->
        <div v-if="!!icon" class="icon-container">
          <q-icon :name="icon" :color="iconColor" size="24px" />
        </div>
        <!-- ドットアイコン -->
        <div v-else class="icon-container">
          <svg class="dot" width="6px" height="6px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <circle cx="3" cy="3" r="3" fill="#9b9b9b" stroke-width="0" />
          </svg>
        </div>
        <!-- アイテム -->
        <div class="item">
          <q-checkbox v-model="checked" />
          <span>{{ label }}</span>
        </div>
      </div>
    </div>

    <!-- 子ノード -->
    <div ref="childContainer" class="child-container" :class="{ opened: opened }"></div>
  </div>
</template>

<script lang="ts">
import { CompTreeCheckboxNodeData } from './types'
import CompTreeNode from '@/lib/components/simple/tree-view/comp-tree-node.vue'
import CompTreeView from '@/lib/components/simple/tree-view/comp-tree-view.vue'
import { Component } from 'vue-property-decorator'

@Component
export default class CompTreeCheckboxNode extends CompTreeNode {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get extraEventNames(): string[] {
    return ['checked-changed']
  }

  get checked(): boolean {
    return this.nodeData.checked!
  }

  set checked(value: boolean) {
    const changed = this.nodeData.checked !== value
    this.nodeData.checked = value
    if (changed) {
      this.dispatchExtraEvent('checked-changed')
    }
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected readonly nodeData!: CompTreeCheckboxNodeData

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  init(nodeData: CompTreeCheckboxNodeData): void {
    this.initBase(nodeData)
    // 任意項目は値が設定されていないとリアクティブにならないのでここで初期化
    this.$set(nodeData, 'checked', Boolean(nodeData.checked))
  }
}
</script>
