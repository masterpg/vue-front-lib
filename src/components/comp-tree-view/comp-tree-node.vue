<style lang="stylus" scoped>
@import '../../styles/app.variables.styl'

.main {
}

.item-container {
  padding-top: var(--comp-tree-distance, 6px)

  &.eldest {
    padding-top: 0
  }

  .icon-container {
    @extend $layout-horizontal
    @extend $layout-center-center
    width: 1.5em
    height: 1.5em
    margin-right 6px
  }

  .toggle-icon {
    transition transform .5s
    cursor: pointer
  }

  .icon {
  }
}

.children-container {
  padding-left: var(--comp-tree-indent, 16px)
  height: 0
  overflow: hidden
}
</style>

<template>
  <div class="main">
    <div ref="itemContainer" class="item-container layout horizontal center" :class="{ eldest: isEldest }" @selected="m_itemOnSelected">
      <!-- トグルアイコン -->
      <div v-if="m_hasChildren" class="icon-container">
        <q-icon name="arrow_right" size="26px" color="grey-6" class="toggle-icon" :class="[opened ? 'rotate-90' : '']" @click="m_toggleIconOnClick" />
      </div>
      <!-- 指定アイコン -->
      <div v-if="!!icon" class="icon-container">
        <q-icon :name="icon" :color="iconColor" size="24px" class="icon" />
      </div>
      <!-- ドットアイコン -->
      <div v-else-if="!m_hasChildren" class="icon-container">
        <svg class="dot" width="6px" height="6px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <circle cx="3" cy="3" r="3" stroke="blue" fill="#9b9b9b" stroke-width="0" />
        </svg>
      </div>
    </div>
    <div ref="childContainer" class="children-container" :class="{ opened: opened }"></div>
  </div>
</template>

<script lang="ts">
import * as treeViewUtils from '@/components/comp-tree-view/comp-tree-view-utils'
import { CompTreeNodeData, CompTreeNodeParent } from '@/components/comp-tree-view/types'
import { BaseComponent } from '@/components'
import CompTreeNodeItem from '@/components/comp-tree-view/comp-tree-node-item.vue'
import { Component } from 'vue-property-decorator'
import Vue from 'vue'

@Component({ name: 'comp-tree-node' })
export default class CompTreeNode<N extends CompTreeNodeItem = any, T extends CompTreeNodeData<T> = any> extends BaseComponent
  implements CompTreeNodeParent {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    this.nodeItem.$mount()
    this.m_itemContainer.appendChild(this.nodeItem.$el)

    for (const eventName of this.nodeItem.extraEventNames) {
      this.m_itemContainer.addEventListener(eventName, this.m_itemOnExtraEvent)
    }

    // this.m_childContainerObserver = new MutationObserver(records => {
    //   console.log(records)
    // })
    // this.m_childContainerObserver.observe(this.m_childContainer, { childList: true })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_nodeItem: N = {} as any

  get nodeItem(): N {
    return this.m_nodeItem
  }

  /**
   * 自身が最年長のノードかを示すフラグです。
   */
  isEldest: boolean = false

  /**
   * アイコン名です。
   * https://material.io/tools/icons/?style=baseline
   */
  icon: string = ''

  /**
   * アイコンの色を指定します。
   * 例: primary, indigo-8
   */
  iconColor: string = ''

  private m_opened: boolean = false

  /**
   * アイテムの開閉です。
   */
  get opened(): boolean {
    return this.m_opened
  }

  /**
   * ラベルです。
   */
  get label(): string {
    return this.nodeItem.label
  }

  /**
   * ノードを特定するための値です。
   */
  get value(): string {
    return this.nodeItem.value
  }

  /**
   * 選択不可フラグです。
   * true: 選択不可, false: 選択可
   */
  get unselectable(): boolean {
    return this.nodeItem.unselectable
  }

  /**
   * 選択されているか否かです。
   */
  get selected(): boolean {
    return this.nodeItem.selected
  }

  set selected(value: boolean) {
    this.nodeItem.selected = value
  }

  private m_parent?: CompTreeNode

  /**
   * 親ノードです。
   */
  get parent(): CompTreeNode | undefined {
    return this.m_parent
  }

  private m_children: CompTreeNode[] = []

  /**
   * 子ノードです。
   */
  get children(): CompTreeNode[] {
    return this.m_children
  }

  /**
   * 標準で発火するイベントとは別に、追加で発火するイベント名のリストです。
   */
  get extraEventNames(): string[] {
    return this.nodeItem.extraEventNames
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_childContainerObserver!: MutationObserver

  get m_hasChildren() {
    return this.children.length > 0
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  get m_itemContainer(): HTMLElement {
    return this.$refs.itemContainer as HTMLElement
  }

  get m_childContainer(): HTMLElement {
    return this.$refs.childContainer as HTMLElement
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  init(nodeData: T): void {
    const NodeItemClass = Vue.extend(nodeData.itemClass || CompTreeNodeItem)
    const item = new NodeItemClass() as N
    item.init(nodeData)

    this.m_nodeItem = item
    this.m_opened = Boolean(nodeData.opened)
    this.icon = nodeData.icon || ''
    this.iconColor = nodeData.iconColor || ''
  }

  /**
   * 指定されたノードデータからノードツリーを構築します。
   * @param nodeData ノードツリーを構築するためのデータ
   * @param insertIndex ノードの挿入位置
   */
  buildChild(nodeData: T, insertIndex?: number): CompTreeNode {
    const node = treeViewUtils.buildNode(nodeData, this, insertIndex)
    return node
  }

  addChild(childNode: CompTreeNode, insertIndex?: number): void {
    childNode.$mount()

    if (insertIndex === undefined || insertIndex === null) {
      insertIndex = this.children.length
    }

    this.m_insertChildIntoContainer(childNode, insertIndex)

    const childContainerHeight = this.m_getChildrenContainerHeight(this)
    const childNodeHeight = childContainerHeight + childNode.$el.getBoundingClientRect().height
    this.m_childContainer.style.height = `${childNodeHeight}px`

    childNode.m_parent = this
    this.children.splice(insertIndex, 0, childNode)

    if (this.parent) {
      this.parent.m_refreshChildrenContainerHeight(false)
    }
  }

  /**
   * 子ノードの開閉をトグルします。
   * @param animated
   */
  toggle(animated: boolean = true): void {
    this.m_toggle(!this.m_opened, animated)
  }

  /**
   * 子ノードを展開します。
   * @param animated
   */
  open(animated: boolean = true): void {
    this.m_toggle(true, animated)
  }

  /**
   * 子ノードを閉じます。
   * @param animated
   */
  close(animated: boolean = true): void {
    this.m_toggle(false, animated)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_toggle(opened: boolean, animated: boolean = true): void {
    this.m_opened = opened
    this.m_refreshChildrenContainerHeight(animated)

    this.$el.dispatchEvent(
      new CustomEvent('opened-changed', {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    )
  }

  /**
   * 子ノードが配置されるコンテナの高さを再計算し、高さをリフレッシュします。
   * @param animated
   */
  private m_refreshChildrenContainerHeight(animated: boolean): void {
    this.m_childContainer.style.transition = animated ? 'height .5s' : ''

    const newHeight = this.m_getChildrenContainerHeight(this)
    this.m_childContainer.style.height = `${newHeight}px`

    if (this.parent) {
      this.parent.m_refreshChildrenContainerHeight(animated)
    }
  }

  /**
   * 子ノードが配置されるコンテナの高さを算出します。
   * @param base 基準となるノードを指定します。このノードの子孫を走査して高さが算出されるます。
   */
  private m_getChildrenContainerHeight(base: CompTreeNode): number {
    let result = 0

    if (this.opened) {
      const style = getComputedStyle(this.m_childContainer)
      const borderTopWidth = parseInt(style.getPropertyValue('border-top-width'), 10)
      const borderBottomWidth = parseInt(style.getPropertyValue('border-bottom-width'), 10)
      const paddingTop = parseInt(style.getPropertyValue('padding-top'), 10)
      const paddingBottom = parseInt(style.getPropertyValue('padding-bottom'), 10)
      result = result + borderTopWidth + borderBottomWidth + paddingTop + paddingBottom

      for (let child of this.children) {
        result += child.m_getChildrenContainerHeight(base)
      }
    }

    // 基準ノードの高さは排除したいためのif文
    if (this !== base) {
      result += this.m_itemContainer.getBoundingClientRect().height
    }

    return result
  }

  /**
   * 子ノードを子コンテナへ挿入します。
   * @param childNode 追加する子ノード
   * @param insertIndex ノードの挿入位置
   */
  private m_insertChildIntoContainer(childNode: CompTreeNode, insertIndex: number): void {
    const childrenLength = this.m_childContainer.children.length

    // 挿入位置が大きすぎないかを検証
    if (childrenLength < insertIndex) {
      throw new Error('insertIndex is too big.')
    }

    if (insertIndex === 0 || childrenLength === insertIndex) {
      this.m_childContainer.appendChild(childNode.$el)
    } else {
      const afterNode = this.m_childContainer.children[insertIndex]
      this.m_childContainer.insertBefore(childNode.$el, afterNode)
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * トグルアイコンのクリック時のリスナです。
   */
  private m_toggleIconOnClick() {
    this.toggle()
  }

  /**
   * ノードアイテムが選択された際のリスナです。
   * @param e
   */
  private m_itemOnSelected(e) {
    e.stopImmediatePropagation()

    this.$el.dispatchEvent(
      new CustomEvent('selected', {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    )
  }

  /**
   * ノードアイテムが発火する標準のイベントとは別に、独自イベントが発火した際のリスナです。
   * @param e
   */
  private m_itemOnExtraEvent(e) {
    e.stopImmediatePropagation()

    this.$el.dispatchEvent(
      new CustomEvent(e.type, {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    )
  }
}
</script>
