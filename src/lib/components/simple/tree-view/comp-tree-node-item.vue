<style lang="sass" scoped>
@import '../../../styles/lib.variables'

.item
  cursor: pointer
  white-space: nowrap

  &:hover
    text-decoration: underline

  &.selected
    color: var(--comp-tree-selected-color, $pink-5)

  &.unselectable
    color: var(--comp-tree-unselectable-color, $grey-9)
    cursor: default
    &:hover
      text-decoration: none
</style>

<template>
  <span class="item" :class="{ selected, unselectable }" @click="itemOnClick()">{{ label }}</span>
</template>

<script lang="ts">
import { CompTreeNodeData, CompTreeNodeEditData } from './types'
import { BaseComponent } from '../../../base/component'
import { CompTreeViewUtils } from './comp-tree-view-utils'
import { Component } from 'vue-property-decorator'
const isBoolean = require('lodash/isBoolean')
const isString = require('lodash/isString')

@Component
export default class CompTreeNodeItem<NodeData extends CompTreeNodeData = any> extends BaseComponent {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  /**
   * ラベルです。
   */
  get label(): string {
    return this.nodeData.label
  }

  set label(value: string) {
    const oldValue = this.nodeData.label
    this.nodeData.label = value
    CompTreeViewUtils.dispatchNodePropertyChanged(this, { property: 'label', newValue: value, oldValue })
  }

  /**
   * ノードを特定するための値です。
   */
  get value(): string {
    return this.nodeData.value
  }

  set value(value: string) {
    const oldValue = this.nodeData.value
    this.nodeData.value = value
    CompTreeViewUtils.dispatchNodePropertyChanged(this, { property: 'value', newValue: value, oldValue })
  }

  /**
   * 選択不可フラグです。
   */
  get unselectable(): boolean {
    return this.nodeData.unselectable!
  }

  set unselectable(value: boolean) {
    this.nodeData.unselectable = value
    if (value) {
      this.selected = false
    }
  }

  /**
   * 選択されているか否かです。
   */
  get selected(): boolean {
    return this.nodeData.selected!
  }

  set selected(value: boolean) {
    this.m_setSelected(value, false)
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
  //  Variable
  //
  //----------------------------------------------------------------------

  protected nodeData: NodeData = {} as any

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  init(nodeData: NodeData): void {
    // 任意項目は値が設定されていないとリアクティブにならないのでここで初期化
    this.$set(nodeData, 'unselectable', Boolean(nodeData.unselectable))
    this.$set(nodeData, 'selected', Boolean(nodeData.selected))
    this.nodeData = nodeData

    this.m_setSelected(this.nodeData.selected!, true)

    this.initPlaceholder(nodeData)
  }

  /**
   * ノードを編集するためのデータを設定します。
   * @param editData
   */
  setNodeData(editData: CompTreeNodeEditData): void {
    if (isString(editData.label)) {
      this.label = editData.label!
    }

    if (isString(editData.value)) {
      this.value = editData.value!
    }

    if (isBoolean(editData.unselectable)) {
      this.unselectable = editData.unselectable!
    }

    if (isBoolean(editData.selected)) {
      this.selected = editData.selected!
    }
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

  /**
   * selectedの設定を行います。
   * @param value selectedの設定値を指定
   * @param initializing 初期化中か否かを指定
   */
  private m_setSelected(value: boolean, initializing: boolean): void {
    const changed = this.nodeData.selected !== value
    // 選択不可の場合
    if (this.unselectable) {
      if (changed) {
        this.nodeData.selected = false
        !initializing && CompTreeViewUtils.dispatchSelectedChanged(this)
      }
    }
    // 選択可能な場合
    else {
      if (changed) {
        this.nodeData.selected = value
        !initializing && CompTreeViewUtils.dispatchSelectedChanged(this)
      }
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  protected itemOnClick(e) {
    this.selected = true
  }
}
</script>
