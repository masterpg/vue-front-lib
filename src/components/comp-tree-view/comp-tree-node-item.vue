<style lang="stylus" scoped>
@import '../../styles/app.variables.styl'

.item {
  cursor: pointer

  &:hover {
    text-decoration: underline
  }

  &.selected {
    color: var(--comp-tree-selected-color, $pink-5)
  }

  &.unselectable {
    color: var(--comp-tree-unselectable-color, $grey-9)
    cursor: default
    &:hover {
      text-decoration: none
    }
  }
}
</style>

<template>
  <span class="item" :class="{ selected: selected, unselectable: unselectable }" @click="itemOnClick">{{ label }}</span>
</template>

<script lang="ts">
import * as treeViewUtils from '@/components/comp-tree-view/comp-tree-view-utils'
import { BaseComponent } from '@/components'
import { CompTreeNodeData } from '@/components/comp-tree-view/types'
import { Component } from 'vue-property-decorator'

@Component({ name: 'comp-tree-node-item' })
export default class CompTreeNodeItem<NodeData extends CompTreeNodeData = CompTreeNodeData> extends BaseComponent {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  /**
   * ラベルです。
   */
  label: string = ''

  private m_value: string = ''

  /**
   * ノードを特定するための値です。
   */
  get value(): string {
    return this.m_value
  }

  set value(value: string) {
    const oldValue = this.m_value
    this.m_value = value
    treeViewUtils.dispatchValueChanged(this, { newValue: value, oldValue })
  }

  /**
   * 選択不可フラグです。
   */
  unselectable: boolean = false

  private m_selected: boolean = false

  /**
   * 選択されているか否かです。
   */
  get selected(): boolean {
    return this.m_selected
  }

  set selected(value: boolean) {
    this.m_selected = value
    if (this.m_selected) {
      this.selectItem()
    }
  }

  /**
   * ノードアイテムが発火する標準のイベントとは別に、独自で発火するイベント名のリストです。
   * CompTreeNodeItemを拡張し、そのノードアイテムで独自イベントを発火するよう実装した場合、
   * このプロパティをオーバーライドし、イベント名の配列を返すよう実装してください。
   */
  get extraEventNames(): string[] {
    return []
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  init(nodeData: NodeData): void {
    this.label = nodeData.label
    this.m_value = nodeData.value || ''
    this.unselectable = Boolean(nodeData.unselectable)
    this.m_selected = Boolean(nodeData.selected)

    this.initPlaceholder(nodeData)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * CompTreeNodeItemを拡張する際、初期化時に独自処理が必要な場合のプレースホルダーです。
   * 独自処理が必要な場合はこのメソッドをオーバーライドしてください。
   * @param nodeData
   */
  protected initPlaceholder(nodeData: NodeData): void {}

  protected selectItem(): void {
    if (this.unselectable) return

    this.m_selected = true

    treeViewUtils.dispatchSelectedChanged(this)
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  protected itemOnClick(e) {
    this.selectItem()
  }
}
</script>
