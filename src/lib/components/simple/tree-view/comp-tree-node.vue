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
          <span>{{ label }}</span>
        </div>
      </div>
    </div>

    <!-- 子ノード -->
    <div ref="childContainer" class="child-container" :class="{ opened: opened }"></div>
  </div>
</template>

<script lang="ts">
import { ChildrenSortFunc, CompTreeNodeData, CompTreeNodeEditData } from './types'
import { BaseComponent } from '../../../base/component'
import CompTreeView from './comp-tree-view.vue'
import { CompTreeViewUtils } from './comp-tree-view-utils'
import { Component } from 'vue-property-decorator'
import { NoCache } from '../../../base/decorators'
import Vue from 'vue'
const isInteger = require('lodash/isInteger')
const isFunction = require('lodash/isFunction')
const isBoolean = require('lodash/isBoolean')
const isString = require('lodash/isString')
const debounce = require('lodash/debounce')

@Component
export default class CompTreeNode extends BaseComponent {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    this.m_toggle = debounce(this.m_toggleFunc)

    // this.childContainerObserver = new MutationObserver(records => {
    //   console.log(records)
    // })
    // this.childContainerObserver.observe(this.childContainer, { childList: true })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  /**
   * ノードが発火する標準のイベントとは別に、独自で発火するイベント名のリストです。
   * CompTreeNodeを拡張し、そのノードで独自イベントを発火するよう実装した場合、
   * このプロパティをオーバーライドし、イベント名の配列を返すよう実装してください。
   */
  get extraEventNames(): string[] {
    return []
  }

  /**
   * 本ノードが所属するツリービューです。
   */
  @NoCache
  get treeView(): CompTreeView | null {
    const rootNode = this.getRootNode()
    const parentElement = rootNode.$el.parentElement
    if (!parentElement) {
      return null
    }

    const treeView = (parentElement as any).__vue__ as CompTreeView | undefined
    if (!treeView || !treeView.isTreeView) {
      return null
    }

    return treeView
  }

  /**
   * 自身が最年長のノードかを示すフラグです。
   */
  isEldest: boolean = false

  /**
   * アイコン名です。
   * https://material.io/tools/icons/?style=baseline
   */
  get icon(): string {
    return this.nodeData.icon || ''
  }

  set icon(value: string) {
    this.nodeData.icon = value
  }

  /**
   * アイコンの色を指定します。
   * 例: primary, indigo-8
   */
  get iconColor(): string {
    return this.nodeData.iconColor || ''
  }

  set iconColor(value: string) {
    this.nodeData.iconColor = value
  }

  /**
   * アイテムの開閉です。
   */
  get opened(): boolean {
    return this.nodeData.opened!
  }

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

    this.$nextTick(() => {
      this.m_setMinWidth()
    })
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
   * true: 選択不可, false: 選択可
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

  private m_parent: CompTreeNode | null = null

  /**
   * 親ノードです。
   */
  get parent(): CompTreeNode | null {
    return this.m_parent
  }

  private m_children: CompTreeNode[] = []

  /**
   * 子ノードです。
   */
  get children(): CompTreeNode[] {
    return this.m_children
  }

  private m_minWidth: number = 0

  /**
   * ノードの最小幅です。
   */
  get minWidth(): number {
    this.m_setMinWidth()
    return this.m_minWidth
  }

  private m_setMinWidth(): void {
    // ノードコンテナの幅を取得
    let nodeContainerWidth = 0
    for (const el of Array.from(this.m_nodeContainer.children)) {
      nodeContainerWidth += CompTreeViewUtils.getElementWidth(el)
    }
    nodeContainerWidth += CompTreeViewUtils.getElementFrameWidth(this.m_nodeContainer)

    // 子ノードの中で最大幅のものを取得
    let childContainerWidth = 0
    if (this.opened) {
      for (const child of this.children) {
        if (childContainerWidth < child.minWidth) {
          childContainerWidth = child.minWidth
          childContainerWidth += CompTreeViewUtils.getElementFrameWidth(this.m_childContainer)
        }
      }
    }

    // 上記で取得したノードコンテナ幅と子ノードコンテナ幅を比較し、大きい方を採用する
    this.m_minWidth = nodeContainerWidth >= childContainerWidth ? nodeContainerWidth : childContainerWidth
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_nodeData: CompTreeNodeData = {} as any

  protected get nodeData(): CompTreeNodeData {
    return this.m_nodeData
  }

  protected get hasChildren() {
    return this.children.length > 0
  }

  private childContainerObserver!: MutationObserver

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_nodeContainer(): HTMLElement {
    return this.$refs.nodeContainer as HTMLElement
  }

  @NoCache
  get m_childContainer(): HTMLElement {
    return this.$refs.childContainer as HTMLElement
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ノードの初期化を行います。
   *
   * CompTreeNodeItemを拡張する際、初期化時に独自処理が必要な場合は
   * このメソッドをオーバーライドして下さい。
   *
   * @param nodeData
   */
  init(nodeData: CompTreeNodeData): void {
    this.initBase(nodeData)
  }

  /**
   * ノード初期化の基本処理を行います。
   * @param nodeData
   */
  protected initBase(nodeData: CompTreeNodeData): void {
    // 任意項目は値が設定されていないとリアクティブにならないのでここで初期化
    this.$set(nodeData, 'icon', nodeData.icon || '')
    this.$set(nodeData, 'iconColor', nodeData.iconColor || '')
    this.$set(nodeData, 'opened', Boolean(nodeData.opened))
    this.$set(nodeData, 'unselectable', Boolean(nodeData.unselectable))
    this.$set(nodeData, 'selected', Boolean(nodeData.selected))
    this.m_nodeData = nodeData

    this.m_setSelected(this.nodeData.selected!, true)
  }

  /**
   * ノードを編集するためのデータを設定します。
   * @param editData
   */
  setNodeData(editData: CompTreeNodeEditData<CompTreeNodeData>): void {
    this.setBaseNodeData(editData)
  }

  protected setBaseNodeData(editData: CompTreeNodeEditData<CompTreeNodeData>): void {
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
    if (isString(editData.icon)) {
      this.icon = editData.icon!
    }

    if (isString(editData.iconColor)) {
      this.iconColor = editData.iconColor!
    }

    if (isBoolean(editData.opened)) {
      if (editData.opened!) {
        this.open(false)
      } else {
        this.close(false)
      }
    }
  }

  /**
   * 子ノードを追加します。
   * @param child ノード、またはノードを構築するためのデータ
   * @param options
   * <ul>
   *   <li>insertIndex: ノード挿入位置。sortFuncと同時に指定することはできません。</li>
   *   <li>sortFunc: ノードをソートする関数。insertIndexと同時に指定することはできません。</li>
   * </ul>
   */
  addChild(child: CompTreeNodeData | CompTreeNode, options?: { insertIndex?: number | null; sortFunc?: ChildrenSortFunc }): CompTreeNode {
    options = options || {}

    if (isInteger(options.insertIndex) && options.insertIndex! >= 0 && options.sortFunc) {
      throw new Error('You cannot specify both "insertIndex" and "sortFunc".')
    }

    let childNode: CompTreeNode
    const childType = child instanceof Vue ? 'Node' : 'Data'

    // 引数のノードがノードコンポーネントで指定された場合
    if (childType === 'Node') {
      childNode = this.m_addChildByNode(child as CompTreeNode, options)
    }
    // 引数のノードがノードデータで指定された場合
    else if (childType === 'Data') {
      childNode = this.m_addChildByData(child as CompTreeNodeData, options)
    }

    return childNode!
  }

  /**
   * 子ノードを削除します。
   * @param childNode
   */
  removeChild(childNode: CompTreeNode): void {
    this.m_removeChild(childNode, true)
  }

  /**
   * 子ノードの開閉をトグルします。
   * @param animated
   */
  toggle(animated: boolean = true): void {
    this.nodeData.opened = !this.nodeData.opened
    this.m_toggle(this.nodeData.opened, animated)
  }

  /**
   * 子ノードを展開します。
   * @param animated
   */
  open(animated: boolean = true): void {
    if (this.nodeData.opened) return
    this.nodeData.opened = true
    this.m_toggle(this.nodeData.opened, animated)
  }

  /**
   * 子ノードを閉じます。
   * @param animated
   */
  close(animated: boolean = true): void {
    if (!this.nodeData.opened) return
    this.nodeData.opened = false
    this.m_toggle(this.nodeData.opened, animated)
  }

  /**
   * ルートノードを取得します。
   */
  getRootNode(): CompTreeNode {
    if (this.parent) {
      return this.parent.getRootNode()
    }
    return this
  }

  /**
   * 子孫ノードを取得します。
   */
  getDescendants<Node extends CompTreeNode = CompTreeNode>(): Node[] {
    return CompTreeViewUtils.getDescendants(this) as Node[]
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * ノードが発火する標準のイベントとは別な独自イベントを発火します。
   * @param extraEventName
   * @param detail
   */
  protected dispatchExtraEvent<T>(extraEventName: string, detail?: T): void {
    this.$el.dispatchEvent(
      new CustomEvent(extraEventName, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail,
      })
    )
  }

  private m_addChildByData(childNodeData: CompTreeNodeData, options?: { insertIndex?: number | null; sortFunc?: ChildrenSortFunc }): CompTreeNode {
    options = options || {}
    if (!this.treeView) {
      throw new Error(`'treeView' not found.`)
    }

    if (this.treeView.getNode(childNodeData.value)) {
      throw new Error(`The node "${childNodeData.value}" already exists.`)
    }

    // 子ノードの作成
    const childNode = CompTreeViewUtils.newNode(childNodeData)

    // ノード挿入位置を決定
    const insertIndex = this.m_getInsertIndex(childNode, options)

    // コンテナにノードを追加
    this.m_insertChildIntoContainer(childNode, insertIndex)

    // コンテナの高さを設定
    if (this.opened) {
      const childrenContainerHeight = this.m_getChildrenContainerHeight(this)
      const childNodeHeight = childrenContainerHeight + childNode.$el.getBoundingClientRect().height
      this.m_childContainer.style.height = `${childNodeHeight}px`
    }

    // ノードの親子関係を設定
    childNode.m_parent = this
    this.children.splice(insertIndex, 0, childNode)

    // 親ノードのコンテナの高さを設定
    if (this.parent) {
      this.parent.m_refreshChildrenContainerHeight()
    }

    // 子ノードの設定
    const len = childNodeData.children ? childNodeData.children.length : 0
    for (let i = 0; i < len; i++) {
      childNode.addChild(childNodeData.children![i], { insertIndex: i })
    }

    // ノードが追加されたことを通知するイベントを発火
    CompTreeViewUtils.dispatchNodeAdded(childNode)

    return childNode
  }

  private m_addChildByNode(childNode: CompTreeNode, options?: { insertIndex?: number | null; sortFunc?: ChildrenSortFunc }): CompTreeNode {
    options = options || {}

    // 追加しようとするノードの子に自ノードが含まれないことを検証
    const descendantMap = CompTreeViewUtils.getDescendantMap(childNode)
    if (descendantMap[this.value]) {
      throw new Error(`The specified node "${childNode.value}" contains the new parent "${this.value}".`)
    }

    //
    // 一旦親からノードを削除
    //
    if (childNode.parent) {
      // 親ノードから自ノードを削除
      childNode.parent.m_removeChild(childNode, false)
    } else {
      // 親ノードがない場合ツリービューが親となるので、ツリービューから自ノードを削除
      this.treeView && this.treeView.removeNode(childNode.value)
    }

    // ノード挿入位置を決定
    const insertIndex = this.m_getInsertIndex(childNode, options)

    // コンテナにノードを追加
    this.m_insertChildIntoContainer(childNode, insertIndex)

    // コンテナの高さを設定
    if (this.opened) {
      const childrenContainerHeight = this.m_getChildrenContainerHeight(this)
      const childNodeHeight = childrenContainerHeight + childNode.$el.getBoundingClientRect().height
      this.m_childContainer.style.height = `${childNodeHeight}px`
    }

    // ノードの親子関係を設定
    childNode.m_parent = this
    this.children.splice(insertIndex, 0, childNode)

    // 親ノードのコンテナの高さを設定
    if (this.parent) {
      this.parent.m_refreshChildrenContainerHeight()
    }

    // 子ノードの設定
    for (let i = 0; i < childNode.children.length; i++) {
      const descendant = childNode.children[i]
      childNode.addChild(descendant, { insertIndex: i })
    }

    // ノードが追加されたことを通知するイベントを発火
    CompTreeViewUtils.dispatchNodeAdded(childNode)

    return childNode
  }

  private m_getInsertIndex(newNode: CompTreeNode, options?: { insertIndex?: number | null; sortFunc?: ChildrenSortFunc }): number {
    options = options || {}

    if (isInteger(options.insertIndex)) {
      return options.insertIndex!
    } else if (isFunction(options.sortFunc)) {
      const children = [...this.children, newNode]
      children.sort(options.sortFunc!)
      const index = children.indexOf(newNode)
      return index === -1 ? this.children.length : index
    } else {
      return this.children.length
    }
  }

  private m_toggle!: (opened: boolean, animated?: boolean) => void

  private m_toggleFunc(opened: boolean, animated: boolean = true): void {
    if (animated) {
      this.m_refreshChildrenContainerHeightWithAnimation()
    } else {
      this.m_refreshChildrenContainerHeight()
    }
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
   * (アニメーションなしで)
   */
  private m_refreshChildrenContainerHeight(): void {
    const newHeight = this.m_getChildrenContainerHeight(this)
    this.m_childContainer.style.transition = ''
    this.m_childContainer.style.height = `${newHeight}px`

    if (this.parent) {
      this.parent.m_refreshChildrenContainerHeight()
    }
  }

  /**
   * 子ノードが配置されるコンテナの高さを再計算し、高さをリフレッシュします。
   * (アニメーションしながら)
   */
  private m_refreshChildrenContainerHeightWithAnimation(): Promise<void> {
    const DURATION = 500

    return new Promise<void>(resolve => {
      this.m_childContainer.style.transition = `height ${DURATION / 1000}s`

      const newHeight = this.m_getChildrenContainerHeight(this)
      this.m_childContainer.style.height = `${newHeight}px`

      if (this.parent) {
        this.parent.m_refreshChildrenContainerHeightWithAnimation()
      }

      setTimeout(resolve, DURATION)
    })
  }

  /**
   * 子ノードが配置されるコンテナの高さを算出します。
   * @param base 基準となるノードを指定します。このノードの子孫を走査して高さが算出されます。
   */
  private m_getChildrenContainerHeight(base: CompTreeNode): number {
    let result = 0

    if (this.opened) {
      result += CompTreeViewUtils.getElementFrameHeight(this.m_childContainer)
      for (const child of this.children) {
        result += child.m_getChildrenContainerHeight(base)
      }
    }

    // 基準ノードの高さは排除したいためのif文
    if (this !== base) {
      result += this.m_nodeContainer.getBoundingClientRect().height
    }

    return result
  }

  /**
   * 子コンテナへノードを挿入します。
   * @param node 追加するノード
   * @param insertIndex ノード挿入位置
   */
  private m_insertChildIntoContainer(node: CompTreeNode, insertIndex: number): void {
    const childrenLength = this.m_childContainer.children.length

    // 挿入位置が大きすぎないかを検証
    if (childrenLength < insertIndex) {
      throw new Error('insertIndex is too big.')
    }

    // コンテナにノードを追加
    if (childrenLength === insertIndex) {
      this.m_childContainer.appendChild(node.$el)
    } else {
      const afterNode = this.m_childContainer.children[insertIndex]
      this.m_childContainer.insertBefore(node.$el, afterNode)
    }
  }

  /**
   * 子ノードを削除します。
   * @param childNode
   * @param isDispatchEvent 削除イベントを発火するか否かを指定
   * @return 削除された場合はtrue, 削除対象のノードがなく削除が行われなかった場合はfalse
   */
  private m_removeChild(childNode: CompTreeNode, isDispatchEvent: boolean): boolean {
    const index = this.children.indexOf(childNode)
    if (index >= 0) {
      isDispatchEvent && CompTreeViewUtils.dispatchNodeBeforeRemoved(this, childNode)
      childNode.m_parent = null
      this.m_children.splice(index, 1)
      this.m_removeChildFromContainer(childNode)
      this.m_refreshChildrenContainerHeight()
      isDispatchEvent && CompTreeViewUtils.dispatchNodeRemoved(this, childNode)
      return true
    }
    return false
  }

  /**
   * 子コンテナからノードを削除します。
   * @param node
   */
  private m_removeChildFromContainer(node: CompTreeNode): void {
    this.m_childContainer.removeChild(node.$el)
  }

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

  /**
   * トグルアイコンのクリック時のリスナです。
   */
  protected toggleIconOnClick() {
    this.toggle()
  }

  /**
   * アイテム部分のクリック時のリスナです。
   */
  protected itemContainerOnClick(e) {
    this.selected = true
  }
}
</script>
