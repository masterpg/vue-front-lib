<style lang="sass" scoped>
@import 'src/lib/styles/lib.variables'

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
      <!-- 遅延ロードアイコン -->
      <div v-show="lazyLoadStatus === 'loading'" ref="lazyLoadIcon" class="icon-container">
        <comp-loading-spinner size="20px" />
      </div>
      <!-- トグルアイコン -->
      <div v-show="lazyLoadStatus !== 'loading'" class="icon-container">
        <!-- トグルアイコン有り -->
        <template v-if="hasChildren">
          <q-icon name="arrow_right" size="26px" color="grey-6" class="toggle-icon" :class="[opened ? 'rotate-90' : '']" @click="toggleIconOnClick" />
        </template>
        <!-- トグルアイコン無し -->
        <template v-else>
          <q-icon name="" size="26px" />
        </template>
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
    <div ref="childContainer" class="child-container"></div>
  </div>
</template>

<script lang="ts">
import { BaseComponent, NoCache } from '@/lib/base'
import { ChildrenSortFunc, CompTreeNodeData, CompTreeNodeEditData, CompTreeNodeParent, CompTreeViewLazyLoadStatus } from './types'
import CompLoadingSpinner from '../loading-spinner/comp-loading-spinner.vue'
import CompTreeView from './comp-tree-view.vue'
import { CompTreeViewUtils } from './comp-tree-view-utils'
import { Component } from 'vue-property-decorator'
import Vue from 'vue'
import anime from 'animejs'
import debounce from 'lodash/debounce'

@Component({
  components: { CompLoadingSpinner },
})
export default class CompTreeNode<FAMILY_NODE extends CompTreeNode = any> extends BaseComponent implements CompTreeNodeParent {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.resetOwnPositionInParentDebounce = debounce(this.resetOwnPositionInParent, 0)
  }

  mounted() {
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

  private m_treeView: CompTreeView | null = null

  /**
   * 本ノードが所属するツリービューです。
   */
  @NoCache
  get treeView(): CompTreeView | null {
    const rootNode = this.getRootNode()
    return rootNode.m_treeView
  }

  /**
   * このセッターはツリービューが内部的に使用するものであり、
   * ツリービューの利用者が使用することを想定していません。
   */
  set treeView(value: CompTreeView | null) {
    // 自身がルートノードではない場合にツリービューが設定されようとした場合
    // ※ツリービューの設定はルートノードのみに行われます。
    if (this.parent) {
      throw new Error(`A 'treeView' has been set even though it is not the root node.`)
    }

    this.m_treeView = value
  }

  /**
   * 自身が最年長のノードかを示すフラグです。
   */
  isEldest = false

  /**
   * アイコン名です。
   * https://material.io/tools/icons/?style=baseline
   */
  get icon(): string {
    return this.nodeData.icon || ''
  }

  set icon(value: string) {
    this.nodeData.icon = value

    this.resetOwnPositionInParentDebounce()
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

    this.resetOwnPositionInParentDebounce()
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
    CompTreeViewUtils.dispatchNodePropertyChange(this, { property: 'label', newValue: value, oldValue })

    this.resetOwnPositionInParentDebounce()

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
    CompTreeViewUtils.dispatchNodePropertyChange(this, { property: 'value', newValue: value, oldValue })

    this.resetOwnPositionInParentDebounce()
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

    this.resetOwnPositionInParentDebounce()
  }

  /**
   * 選択されているか否かです。
   */
  get selected(): boolean {
    return this.nodeData.selected!
  }

  set selected(value: boolean) {
    this.m_setSelected(value, { silent: false })

    this.resetOwnPositionInParentDebounce()
  }

  /**
   * 選択状態を設定します。
   * @param selected 選択状態を指定
   * @param silent 選択系イベントを発火したくない場合はtrueを指定
   */
  setSelected(selected: boolean, silent: boolean): void {
    this.m_setSelected(selected, { silent })

    this.resetOwnPositionInParentDebounce()
  }

  private m_parent: FAMILY_NODE | null = null

  /**
   * 親ノードです。
   */
  get parent(): FAMILY_NODE | null {
    return this.m_parent
  }

  private m_children: FAMILY_NODE[] = []

  /**
   * 子ノードです。
   */
  get children(): FAMILY_NODE[] {
    return this.m_children
  }

  /**
   * 子ノードの読み込みを遅延ロードするか否かです。
   */
  get lazy(): boolean {
    return this.nodeData.lazy!
  }

  set lazy(value: boolean) {
    this.nodeData.lazy = value

    this.resetOwnPositionInParentDebounce()
  }

  /**
   * 子ノード読み込みの遅延ロード状態です。
   */
  get lazyLoadStatus(): CompTreeViewLazyLoadStatus {
    return this.nodeData.lazyLoadStatus!
  }

  set lazyLoadStatus(value: CompTreeViewLazyLoadStatus) {
    this.nodeData.lazyLoadStatus = value

    this.resetOwnPositionInParentDebounce()
  }

  /**
   * 子ノードの並びを決めるソート関数です。
   */
  get sortFunc(): ChildrenSortFunc | null {
    return this.nodeData.sortFunc || null
  }

  private m_minWidth = 0

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

  protected get hasChildren(): boolean {
    // 遅延ロードが指定され、かつまだロードされていない場合
    if (this.lazy && this.lazyLoadStatus === 'none') {
      // 子ノードが存在すると仮定する
      return true
    }
    // 上記以外の場合
    else {
      // 実際に子ノードが存在するかを判定する
      return this.children.length > 0
    }
  }

  private m_toggleAnime: { resolve: () => void; anime: anime.AnimeInstance } | null = null

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

  @NoCache
  protected get m_lazyLoadIcon(): HTMLElement {
    return this.$refs.lazyLoadIcon as HTMLElement
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ノードの初期化を行います。
   * @param nodeData
   */
  init(nodeData: CompTreeNodeData): void {
    // 任意項目は値が設定されていないとリアクティブにならないのでここで初期化
    this.$set(nodeData, 'icon', nodeData.icon || '')
    this.$set(nodeData, 'iconColor', nodeData.iconColor || '')
    this.$set(nodeData, 'opened', Boolean(nodeData.opened))
    this.$set(nodeData, 'unselectable', Boolean(nodeData.unselectable))
    this.$set(nodeData, 'selected', Boolean(nodeData.selected))
    this.$set(nodeData, 'lazy', Boolean(nodeData.lazy))
    this.$set(nodeData, 'lazyLoadStatus', nodeData.lazyLoadStatus || 'none')
    this.m_nodeData = nodeData

    // サブクラスで必要な処理を実行
    this.init_sub(nodeData)

    this.m_setSelected(this.nodeData.selected!, { initializing: true })
  }

  /**
   * このコンポーネントを継承したサブクラスで`init()`に追加で処理が必要な場合、
   * その追加処理を記述するためのプレースホルダー関数になります。
   *
   * CompTreeNodeItemを拡張する際、初期化時に追加処理が必要な場合は
   * このメソッドをオーバーライドして下さい。
   *
   * @param nodeData
   */
  protected init_sub(nodeData: CompTreeNodeData): void {}

  /**
   * ノードを編集するためのデータを設定します。
   * @param editData
   */
  setNodeData(editData: CompTreeNodeEditData<CompTreeNodeData>): void {
    if (typeof editData.label === 'string') {
      this.label = editData.label!
    }

    if (typeof editData.value === 'string') {
      this.value = editData.value
    }

    if (typeof editData.unselectable === 'boolean') {
      this.unselectable = editData.unselectable
    }

    if (typeof editData.selected === 'boolean') {
      this.selected = editData.selected
    }

    if (typeof editData.icon === 'string') {
      this.icon = editData.icon
    }

    if (typeof editData.iconColor === 'string') {
      this.iconColor = editData.iconColor
    }

    if (typeof editData.opened === 'boolean') {
      if (editData.opened) {
        this.open(false)
      } else {
        this.close(false)
      }
    }

    if (typeof editData.lazy === 'boolean') {
      this.lazy = editData.lazy
    }

    if (typeof editData.lazyLoadStatus === 'string') {
      this.lazyLoadStatus = editData.lazyLoadStatus
    }

    // サブクラスで必要な処理を実行
    this.setNodeData_sub(editData)

    // 自身の配置位置を再設定
    this.resetOwnPositionInParent()
  }

  /**
   * このコンポーネントを継承したサブクラスで`setNodeData()`に追加で処理が必要な場合、
   * その追加処理を記述するためのプレースホルダー関数になります。
   */
  protected setNodeData_sub(editData: CompTreeNodeEditData<CompTreeNodeData>): void {}

  /**
   * 子ノードを追加します。
   * @param child 追加するノード
   * @param options
   * <ul>
   *   <li>insertIndex: ノード挿入位置。ノードに`sortFunc`が設定されている場合、この値は無視されます。</li>
   * </ul>
   */
  addChild<N extends CompTreeNode>(child: N, options?: { insertIndex?: number | null }): N

  /**
   * 子ノードを追加します。
   * @param child 追加ノードを構築するためのデータ
   * @param options
   * <ul>
   *   <li>insertIndex: ノード挿入位置。ノードに`sortFunc`が設定されている場合、この値は無視されます。</li>
   * </ul>
   */
  addChild<N extends CompTreeNode = FAMILY_NODE>(child: CompTreeNodeData, options?: { insertIndex?: number | null }): N

  addChild(child: CompTreeNodeData | CompTreeNode, options?: { insertIndex?: number | null }): CompTreeNode {
    options = options || {}

    let childNode: CompTreeNode
    const childType = child instanceof Vue ? 'Node' : 'Data'

    // 引数のノードがノードコンポーネントで指定された場合
    if (childType === 'Node') {
      childNode = this.m_addChildByNode(child as CompTreeNode, options) as CompTreeNode
    }
    // 引数のノードがノードデータで指定された場合
    else if (childType === 'Data') {
      childNode = this.m_addChildByData(child as CompTreeNodeData, options) as CompTreeNode
    }

    return childNode!
  }

  /**
   * 子ノードを削除します。
   * @param childNode
   */
  removeChild(childNode: FAMILY_NODE): void {
    this.m_removeChild(childNode, true)
  }

  /**
   * 全ての子ノードを削除します。
   */
  removeAllChildren(): void {
    for (const node of [...this.children]) {
      this.removeChild(node)
    }
  }

  /**
   * 子ノードの開閉をトグルします。
   * @param animated
   */
  toggle(animated = true): void {
    this.m_toggle(!this.opened, animated)
  }

  /**
   * 子ノードを展開します。
   * @param animated
   */
  open(animated = true): void {
    if (this.nodeData.opened) return
    this.m_toggle(true, animated)
  }

  /**
   * 子ノードを閉じます。
   * @param animated
   */
  close(animated = true): void {
    if (!this.nodeData.opened) return
    this.m_toggle(false, animated)
  }

  /**
   * ルートノードを取得します。
   */
  getRootNode<N extends CompTreeNode = FAMILY_NODE>(): N {
    if (this.parent) {
      return this.parent.getRootNode<N>()
    }
    return (this as any) as N
  }

  /**
   * 子孫ノードを取得します。
   */
  getDescendants<N extends CompTreeNode = FAMILY_NODE>(): N[] {
    return CompTreeViewUtils.getDescendants<N>(this)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * 親ノードのコンテナ内における自身の配置位置を再設定します。
   * この関数は以下の条件に一致する場合に呼び出す必要があります。
   * + 親ノードがソート関数によって子ノードの並びを決定している場合
   * + 自ノードのプロパティ変更が自身の配置位置に影響を及ぼす場合
   */
  protected resetOwnPositionInParent(): void {
    // 親が存在しないまたは親にソート関数が設定されていない場合、何もせず終了
    const parent: CompTreeNodeParent | null = this.parent || this.treeView
    if (!parent || !parent.sortFunc) return

    const insertIndex = parent.m_getInsertIndex(this)
    const currentIndex = parent.children.indexOf(this)
    if (insertIndex === currentIndex) return

    if (insertIndex < currentIndex) {
      const afterNode = parent.m_childContainer.children[insertIndex]
      parent.m_childContainer.insertBefore(this.$el, afterNode)
    } else if (insertIndex > currentIndex) {
      const refNode = parent.m_childContainer.children[insertIndex]
      parent.m_childContainer.insertBefore(this.$el, refNode.nextSibling)
    }
    parent.children.sort(parent.sortFunc)
  }

  protected resetOwnPositionInParentDebounce!: () => void

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

  private m_addChildByData(childNodeData: CompTreeNodeData, options?: { insertIndex?: number | null }): CompTreeNode {
    options = options || {}
    if (!this.treeView) {
      throw new Error(`'treeView' not found.`)
    }

    if (this.treeView.getNode(childNodeData.value)) {
      throw new Error(`The node '${childNodeData.value}' already exists.`)
    }

    this.m_ascendSetBlockForDisplay()

    // 子ノードの作成
    const childNode = CompTreeViewUtils.newNode<FAMILY_NODE>(childNodeData)

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
    this.m_children.splice(insertIndex, 0, childNode)

    // 親ノードのコンテナの高さを設定
    if (this.parent) {
      this.parent.m_refreshChildContainerHeight()
    }

    // 子ノードの設定
    const len = childNodeData.children ? childNodeData.children.length : 0
    for (let i = 0; i < len; i++) {
      childNode.addChild(childNodeData.children![i], { insertIndex: i })
    }

    this.m_ascendSetAnyForDisplay()

    // ノードが追加されたことを通知するイベントを発火
    CompTreeViewUtils.dispatchNodeAdd(childNode)

    return childNode
  }

  private m_addChildByNode(childNode: CompTreeNode, options?: { insertIndex?: number | null }): CompTreeNode {
    options = options || {}

    // 追加ノードの子に自ノードが含まれないことを検証
    const descendantDict = CompTreeViewUtils.getDescendantDict(childNode)
    if (descendantDict[this.value]) {
      throw new Error(`The specified node '${childNode.value}' contains the new parent '${this.value}'.`)
    }

    // 追加ノードの親が自ノードの場合
    // ※自ノードの子として追加ノードが既に存在する場合
    if (childNode.parent === this) {
      const newInsertIndex = this.m_getInsertIndex(childNode, options)
      const currentIndex = this.children.indexOf(childNode as FAMILY_NODE)
      // 現在の位置と新しい挿入位置が同じ場合
      if (currentIndex === newInsertIndex) {
        CompTreeViewUtils.dispatchNodeAdd(childNode)
        for (const descendant of CompTreeViewUtils.getDescendants(childNode)) {
          CompTreeViewUtils.dispatchNodeAdd(descendant)
        }
        return childNode
      }
    }

    this.m_ascendSetBlockForDisplay()

    //
    // 前の親から追加ノードを削除
    //
    if (childNode.parent) {
      // 前の親ノードから追加ノードを削除
      childNode.parent.m_removeChild(childNode, false)
    } else {
      // 親ノードがない場合ツリービューが親となるので、ツリービューから追加ノードを削除
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
    this.m_children.splice(insertIndex, 0, childNode as FAMILY_NODE)

    // 親ノードのコンテナの高さを設定
    if (this.parent) {
      this.parent.m_refreshChildContainerHeight()
    }

    // 子ノードの設定
    for (let i = 0; i < childNode.children.length; i++) {
      const descendant = childNode.children[i]
      childNode.addChild(descendant, { insertIndex: i })
    }

    this.m_ascendSetAnyForDisplay()

    // ノードが追加されたことを通知するイベントを発火
    CompTreeViewUtils.dispatchNodeAdd(childNode)

    return childNode
  }

  m_getInsertIndex(newNode: CompTreeNode, options?: { insertIndex?: number | null }): number {
    options = options || {}

    // ソート関数が指定されている場合
    if (typeof this.sortFunc === 'function') {
      const children: CompTreeNode[] = []
      if (this.children.includes(newNode as FAMILY_NODE)) {
        children.push(...this.children)
      } else {
        children.push(...this.children, newNode)
      }
      children.sort(this.sortFunc)
      return children.indexOf(newNode)
    }
    // 挿入位置が指定された場合
    else if (typeof options.insertIndex === 'number') {
      return options.insertIndex
    }
    // 何も指定されていなかった場合
    else {
      return this.children.length
    }
  }

  private m_toggle(opened: boolean, animated: boolean): void {
    // 遅延ロードが指定され、かつまだロードされていない場合
    if (this.lazy && this.lazyLoadStatus === 'none') {
      this.m_startLazyLoad(() => {
        this.m_toggle(opened, animated)
      })
    }
    // 上記以外の場合
    else {
      const changed = this.opened !== opened
      this.nodeData.opened = opened

      if (animated) {
        this.m_refreshChildContainerHeightWithAnimation()
      } else {
        this.m_refreshChildContainerHeight()
      }

      if (changed) {
        this.$el.dispatchEvent(
          new CustomEvent('open-change', {
            bubbles: true,
            cancelable: true,
            composed: true,
          })
        )
      }
    }
  }

  /**
   * 子ノードが配置されるコンテナの高さを再計算し、高さをリフレッシュします。
   * (アニメーションなしで)
   */
  private m_refreshChildContainerHeight(): void {
    this.m_ascendSetBlockForDisplay()

    // 子ノードコンテナの高さを取得
    const newHeight = this.m_getChildrenContainerHeight(this)

    // 子ノードコンテナの高さを設定
    this.m_childContainer.style.height = `${newHeight}px`

    // 親ノードの高さも再計算して、高さをリフレッシュ
    this.parent && this.parent.m_refreshChildContainerHeight()

    this.m_ascendSetAnyForDisplay()
  }

  /**
   * 子ノードが配置されるコンテナの高さを再計算し、高さをリフレッシュします。
   * (アニメーションしながら)
   */
  private m_refreshChildContainerHeightWithAnimation(): Promise<void> {
    const DURATION = 500

    return new Promise<void>(resolve => {
      // アニメーションが実行中の場合は停止
      if (this.m_toggleAnime) {
        this.m_toggleAnime.anime.pause()
        this.m_toggleAnime.resolve()
        this.m_toggleAnime = null
      }

      this.m_ascendSetBlockForDisplay()

      // 子ノードコンテナの高さを取得
      const newHeight = this.m_getChildrenContainerHeight(this)

      // アニメーションを実行
      const toggleAnime = anime({
        targets: this.m_childContainer,
        height: `${newHeight}px`,
        duration: DURATION,
        easing: 'easeOutCubic',
        complete: () => {
          this.m_toggleAnime = null
          this.m_ascendSetAnyForDisplay()
          resolve()
        },
      })

      // 実行中アニメーションの情報を保存
      this.m_toggleAnime = { resolve, anime: toggleAnime }

      // 親ノードの高さも再計算して、高さをリフレッシュ
      this.parent && this.parent.m_refreshChildContainerHeightWithAnimation()
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
    const index = this.children.indexOf(childNode as FAMILY_NODE)
    if (index >= 0) {
      isDispatchEvent && CompTreeViewUtils.dispatchBeforeNodeRemove(this, childNode)
      childNode.m_parent = null
      this.m_children.splice(index, 1)
      this.m_removeChildFromContainer(childNode)
      this.m_refreshChildContainerHeight()
      isDispatchEvent && CompTreeViewUtils.dispatchNodeRemove(this, childNode)
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
   * @param options
   * <ul>
   *   <li>initializing 初期化中か否かを指定</li>
   *   <li>silent 選択イベントを発火したくない場合はtrueを指定</li>
   * </ul>
   */
  private m_setSelected(value: boolean, options: { initializing?: boolean; silent?: boolean } = {}): void {
    const initializing = typeof options.initializing === 'boolean' ? options.initializing : false
    const silent = typeof options.silent === 'boolean' ? options.silent : false
    const changed = this.nodeData.selected !== value

    // 選択不可の場合
    if (this.unselectable) {
      // 選択解除に変更された場合
      // ※選択不可ノードを選択状態へ変更しようとしてもこのブロックには入らない
      if (changed && !value) {
        this.nodeData.selected = false
        !initializing && CompTreeViewUtils.dispatchSelectChange(this, silent)
      }
    }
    // 選択可能な場合
    else {
      // 選択状態が変更された場合
      if (changed) {
        // 遅延ロードが必要な場合
        // ※遅延ロードが指定され、かつまだロードが開始されていない場合
        if (this.lazy && this.lazyLoadStatus === 'none') {
          this.m_startLazyLoad(() => {
            this.nodeData.selected = value
            // ①select-change
            // > ノードが選択された場合:
            // >   このイベントをCompTreeViewが受け取り、そこでノード選択が｢再度｣行われ、③selectが発火される
            !initializing && CompTreeViewUtils.dispatchSelectChange(this, silent)
          })
        }
        // 遅延ロードの必要がない場合
        else {
          this.nodeData.selected = value
          // ②select-change
          // > ノードが選択された場合:
          // >   このイベントをCompTreeViewが受け取り、そこでノード選択が｢再度｣行われ、③selectが発火される
          !initializing && CompTreeViewUtils.dispatchSelectChange(this, silent)
        }
      }
      // 選択状態が変更されなかった場合
      else {
        // ③select
        value && !initializing && CompTreeViewUtils.dispatchSelect(this, silent)
      }
    }
  }

  /**
   * 子ノードを取得するための遅延ロードを開始します。
   * @param completed 遅延ロードが完了した際に実行されるコールバック関数を指定
   */
  private m_startLazyLoad(completed: () => void): void {
    this.lazyLoadStatus = 'loading'
    CompTreeViewUtils.dispatchLazyLoad(this, () => {
      anime({
        targets: this.m_lazyLoadIcon,
        opacity: '0',
        duration: 150,
        easing: 'easeOutCubic',
        complete: () => {
          this.m_lazyLoadIcon.style.opacity = '1'
          this.lazyLoadStatus = 'loaded'
          completed()
        },
      })
    })
  }

  /**
   * 自ノードから上位ノードに向かって再帰的に「display: block」を設定します。
   *
   * ※このメソッドの存在理由:
   * 自ノードに子ノードを追加する際、いずれかの祖先が「display: none」だと
   * 追加する子ノードのサイズが決定されないため、ノードの高さなどサイズ調整
   * をすることができません。この対応として一時的に上位ノードに「display: block」
   * を設定することでサイズ調整が可能になります。
   */
  private m_ascendSetBlockForDisplay(): void {
    this.m_childContainer.style.display = 'block'
    if (this.parent) {
      this.parent.m_ascendSetBlockForDisplay()
    }
  }

  /**
   * 自ノードから上位ノードに向かって再帰的に適切な「display: [any]」を設定します。
   *
   * ※このメソッドの役割:
   * `m_ascendSetBlockForDisplay()`によって一時的に「display: block」にされていた値を
   * 適切な値に設定し直す役割をします。
   */
  private m_ascendSetAnyForDisplay(): void {
    this.m_childContainer.style.display = this.opened ? 'block' : 'none'
    if (this.parent) {
      this.parent.m_ascendSetAnyForDisplay()
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
