<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.TreeView
  color: var(--tree-view-color, $app-link-color)
  font-size: var(--tree-view-font-size, 14px)
  font-weight: var(--tree-font-weight, $app-link-font-weight)
  padding: var(--tree-padding, 10px)
</style>

<template>
  <div
    ref="el"
    class="TreeView"
    :style="{ minWidth: minWidth + 'px' }"
    @node-property-change="allNodesOnNodePropertyChange"
    @node-add="onNodeAdd"
    @before-node-remove="onBeforeNodeRemove"
    @node-remove="onNodeRemove"
    @select-change="allNodesOnSelectChange"
    @select="allNodesOnSelect"
    @open-change="allNodesOnOpenChange"
    @lazy-load="allNodesOnLazyLoad"
  ></div>
</template>

<script lang="ts">
import * as util from '@/app/components/tree-view/base'
import {
  ChildrenSortFunc,
  NodePropertyChangeDetail,
  TreeNodeData,
  TreeViewEvent,
  TreeViewLazyLoadDoneFunc,
  TreeViewLazyLoadEvent,
  TreeViewSelectEvent,
} from '@/app/components/tree-view/base'
import { Ref, SetupContext, computed, defineComponent, getCurrentInstance, ref } from '@vue/composition-api'
import { TreeNode, TreeNodeImpl } from '@/app/components/tree-view/tree-node.vue'
import { Constructor } from 'web-base-lib'
import Vue from 'vue'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TreeView<NODE extends TreeNode = TreeNode, DATA extends TreeNodeData = TreeNodeData> extends Vue {
  /**
   * ツリービューのトップレベルのノードです。
   */
  readonly children: NODE[]
  /**
   * 選択ノードです。
   */
  selectedNode: NODE | null
  /**
   * ツリービューを構成するノードのコンポーネントクラスを取得します。
   */
  getNodeClass(): Constructor
  /**
   * ツリービューを構成するノードのコンポーネントクラスを設定します。
   * @param nodeClass
   */
  setNodeClass(nodeClass: Constructor): void
  /**
   * 指定されたノードの選択状態を設定します。
   * @param value ノードを特定するための値を指定
   * @param selected 選択状態を指定
   * @param silent 選択系イベントを発火したくない場合はtrueを指定
   */
  setSelectedNode(value: string, selected: boolean, silent?: boolean): void
  /**
   * ノードを特定するためのvalueと一致するノードを取得します。
   * @param value ノードを特定するための値
   */
  getNode(value: string): NODE | undefined
  /**
   * ツリービューの全ノードをツリー構造から平坦化した配列形式で取得します。
   */
  getAllNodes(): NODE[]
  /**
   * 子ノードの並びを決めるソート関数を取得します。
   */
  getSortFunc<N extends TreeNode = NODE>(): ChildrenSortFunc<N> | null
  /**
   * 子ノードの並びを決めるソート関数を設定します。
   */
  setSortFunc(value: ChildrenSortFunc<NODE> | null): void
  /**
   * 指定されたノードデータからノードツリーを構築します。
   * @param nodeDataList ノードツリーを構築するためのデータ
   * @param options
   * <ul>
   *   <li>sortFunc: 子ノードの並びを決めるソート関数</li>
   *   <li>insertIndex: ノード挿入位置。ノードに`sortFunc`が設定されている場合、この値は無視されます。</li>
   *   <li>nodeClass: TreeNodeを拡張した場合、拡張したノードのクラスを指定します。</li>
   * </ul>
   */
  buildTree(
    nodeDataList: DATA[],
    options?: {
      sortFunc?: ChildrenSortFunc<any>
      insertIndex?: number | null
      nodeClass?: Constructor
    }
  ): void
  /**
   * ノードを追加します。
   * @param child 追加するノード
   * @param options
   * <ul>
   *   <li>parent: 親ノードを特定するための値。指定されない場合、ツリービューの子として追加されます。</li>
   *   <li>insertIndex: ノード挿入位置。ノードに`sortFunc`が設定されている場合、この値は無視されます。</li>
   * </ul>
   */
  addNode(child: NODE, options?: { insertIndex?: number | null }): NODE
  /**
   * ノードを追加します。
   * @param child 追加ノードを構築するためのデータ
   * @param options
   * <ul>
   *   <li>parent: 親ノードを特定するための値。指定されない場合、ツリービューの子として追加されます。</li>
   *   <li>insertIndex: ノード挿入位置。ノードに`sortFunc`が設定されている場合、この値は無視されます。</li>
   * </ul>
   */
  addNode(child: DATA, options?: { parent?: string; insertIndex?: number | null }): NODE
  /**
   * ノードを削除します。
   * @param value ノードを特定するための値
   */
  removeNode(value: string): NODE | undefined
  /**
   * 全てのノードを削除します。
   */
  removeAllNodes(): void
}

interface TreeViewImpl<NODE extends TreeNode = TreeNodeImpl, DATA extends TreeNodeData = TreeNodeData> extends TreeView<NODE, DATA> {
  readonly el: HTMLElement
  readonly childContainer: HTMLElement
  sortChildren(): void
  resetNodePositionInParent(node: NODE): void
}

//========================================================================
//
//  Implementation
//
//========================================================================

/**
 * ツリーコンポーネントです。
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--tree-distance` | ノードとノードの縦の間隔です | `6px`
 * `--tree-indent` | ノードの左インデントです | `16px`
 * `--tree-view-font-size` | ノードのフォントサイズです | `14px`
 * `--tree-font-weight` | ノードのフォントの太さです | $link-font-weight
 * `--tree-line-height` | ノードの行の高さです | `26px`
 * `--tree-view-color` | ノードの文字色です | $link-color
 * `--tree-selected-color` | ノード選択時の文字色です | `pink-5`
 * `--tree-unselectable-color` | 非選択ノードの文字色です | `grey-9`
 * `--tree-padding` | ツリービューのpaddingです | `10px`
 */
namespace TreeView {
  export interface Props {}

  export const clazz = defineComponent({
    name: 'TreeView',

    setup: (props: Readonly<Props>, ctx) => setup(props, ctx),
  })

  export function setup(props: Readonly<Props>, ctx: SetupContext) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const self = getCurrentInstance()!.proxy as TreeViewImpl
    const el = ref<HTMLElement>()
    const childContainer = el

    /**
     * ツリービューが管理する全ノードのマップです。
     * key: ノードを特定するための値, value: ノード
     */
    const allNodeDict: { [key: string]: TreeNodeImpl } = {}

    /**
     * ツリービューの最小幅です。
     */
    const minWidth = computed(() => {
      let result = 0
      for (const child of children.value) {
        if (result < child.minWidth) {
          result = child.minWidth
        }
      }
      return result + util.getElementFrameWidth(childContainer.value!)
    })

    let sortFunc: ChildrenSortFunc<any> | null = null

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const children: Ref<TreeNodeImpl[]> = ref([])

    const _selectedNode: Ref<TreeNodeImpl | null> = ref(null)

    const selectedNode = computed({
      get: () => _selectedNode.value,
      set: node => {
        // 選択ノードが指定された場合
        if (node) {
          // 指定されたノードを選択状態に設定
          node.selected = true
        }
        // 選択ノードが指定されなかった場合
        else {
          // 現在の選択ノードを非選択にする
          _selectedNode.value && (_selectedNode.value.selected = false)
        }
      },
    })

    const setSelectedNode: TreeViewImpl['setSelectedNode'] = (value, selected, silent = false) => {
      const node = getNode(value)
      if (!node) return

      // 選択状態にする場合
      if (selected) {
        // 指定されたノードを選択状態に設定
        node.setSelected(true, silent)
      }
      // 非選択状態にする場合
      else {
        // 指定されたノードを非選択にする
        _selectedNode.value && _selectedNode.value.setSelected(false, silent)
      }
    }

    let _nodeClass: Constructor = null as any

    const getNodeClass: TreeView['getNodeClass'] = () => {
      if (!_nodeClass) {
        _nodeClass = TreeNode.clazz
      }
      return _nodeClass
    }

    const setNodeClass: TreeView['setNodeClass'] = nodeClass => {
      _nodeClass = nodeClass
    }

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const getNode: TreeViewImpl['getNode'] = value => {
      return allNodeDict[value] as any
    }

    const getAllNodes: TreeViewImpl['getAllNodes'] = () => {
      const result: TreeNodeImpl[] = []
      for (const child of children.value) {
        result.push(child)
        result.push(...util.getDescendants(child))
      }
      return result as any
    }

    const getSortFunc: TreeViewImpl['getSortFunc'] = () => {
      return sortFunc
    }

    const setSortFunc: TreeViewImpl['setSortFunc'] = value => {
      const _sortChildren = (parent: { sortChildren: () => void; children: TreeNodeImpl[] }) => {
        parent.sortChildren()
        for (const child of parent.children) {
          _sortChildren(child)
        }
      }

      sortFunc = value
      _sortChildren(self)
    }

    const buildTree: TreeViewImpl['buildTree'] = (nodeDataList, options) => {
      sortFunc = options?.sortFunc ?? null
      let insertIndex = options?.insertIndex
      options?.nodeClass && setNodeClass(options.nodeClass)

      nodeDataList.forEach(nodeData => {
        addNodeByData(nodeData, { insertIndex })
        if (typeof insertIndex === 'number') {
          insertIndex++
        }
      })
    }

    const addNode: TreeViewImpl['addNode'] = (node: TreeNodeData | TreeNodeImpl, options?: { parent?: string; insertIndex?: number | null }) => {
      options = options || {}

      let result!: TreeNodeImpl
      const childType = node instanceof Vue ? 'Node' : 'Data'

      // 親が指定されている場合
      // (親を特定する値が空文字の場合があるのでtypeofを使用している)
      if (typeof options.parent === 'string') {
        const parentNode = getNode(options.parent)
        if (!parentNode) {
          throw new Error(`The parent node '${options.parent}' does not exist.`)
        }
        result = parentNode.addChild(node as TreeNodeImpl, options)
      }
      // 親が指定されていない場合
      else {
        // 引数のノードがノードコンポーネントで指定された場合
        if (childType === 'Node') {
          result = addNodeByNode(node as TreeNodeImpl, options)
        }
        // 引数のノードがノードデータで指定された場合
        else if (childType === 'Data') {
          result = addNodeByData(node as TreeNodeData, options)
        }
      }

      return result
    }

    const removeNode: TreeViewImpl['removeNode'] = value => {
      const node = getNode(value)
      if (!node) return

      // 親がツリービューの場合
      // ※node.parentが空の場合、親はツリービュー
      if (!node.parent) {
        removeChildFromContainer(node)
        util.dispatchNodeRemove(self, node)
      }
      // 親がノードの場合
      else {
        node.parent.removeChild(node)
      }

      return node as any
    }

    const removeAllNodes: TreeViewImpl['removeAllNodes'] = () => {
      for (const node of Object.values(allNodeDict)) {
        removeNode(node.value)
      }
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    function addNodeByData(nodeData: TreeNodeData, options?: { insertIndex?: number | null }): TreeNodeImpl {
      if (getNode(nodeData.value)) {
        throw new Error(`The node '${nodeData.value}' already exists.`)
      }

      // ノードの作成
      const node = util.newTreeNode(nodeData, getNodeClass())

      // ノード挿入位置を決定
      const insertIndex = getInsertIndex(node, options)

      // コンテナにノードを追加
      insertChildIntoContainer(node, insertIndex)

      // 子ノードの設定
      const len = nodeData.children?.length ?? 0
      for (let i = 0; i < len; i++) {
        node.addChild(nodeData.children![i], { insertIndex: i })
      }

      // ノードが追加されたことを通知するイベントを発火
      util.dispatchNodeAdd(node)

      return node
    }

    function addNodeByNode(node: TreeNodeImpl, options?: { insertIndex?: number | null }): TreeNodeImpl {
      // 追加ノードの親が自身のツリービューの場合
      // ※自身のツリービューの子として追加ノードが既に存在する場合
      if (!node.parent && node.treeView === self) {
        const newInsertIndex = getInsertIndex(node, options)
        const currentIndex = children.value.indexOf(node)
        // 現在の位置と新しい挿入位置が同じ場合
        if (currentIndex === newInsertIndex) {
          util.dispatchNodeAdd(node)
          for (const descendant of util.getDescendants(node)) {
            util.dispatchNodeAdd(descendant)
          }
          return node
        }
      }

      //
      // 前の親から追加ノードを削除
      //
      if (node.parent) {
        // 親ノードから追加ノードを削除
        node.parent.removeChild(node)
      } else {
        // 親ノードがない場合ツリービューが親となるので、ツリービューから自ノードを削除
        node.treeView?.removeNode(node.value)
      }

      // ノード挿入位置を決定
      const insertIndex = getInsertIndex(node, options)

      // コンテナにノードを追加
      insertChildIntoContainer(node, insertIndex)

      // 子ノードの設定
      for (let i = 0; i < node.children.length; i++) {
        const childNode = node.children[i]
        node.addChild(childNode, { insertIndex: i })
      }

      // ノードが追加されたことを通知するイベントを発火
      util.dispatchNodeAdd(node)

      return node
    }

    const sortChildren: TreeViewImpl['sortChildren'] = () => {
      const sortFunc = getSortFunc()
      if (!sortFunc) return

      children.value.sort(sortFunc)
      for (const child of children.value) {
        childContainer.value!.appendChild(child.el)
      }

      restIsEldest()
    }

    /**
     * 指定ノードの親コンテナ内における配置位置を再設定します。
     * この関数は以下の条件に一致する場合に呼び出す必要があります。
     * + 親ノードがソート関数によって子ノードの並びを決定している場合
     * + 指定ノードのプロパティ変更がソート関数に影響を及ぼす場合
     * @param node
     */
    const resetNodePositionInParent: TreeViewImpl['resetNodePositionInParent'] = node => {
      // ツリービューにソート関数が指定されていない場合、何もしない
      const sortFunc = getSortFunc()
      if (!sortFunc) return

      const insertIndex = getInsertIndex(node)
      const currentIndex = children.value.indexOf(node)
      if (insertIndex === currentIndex) return

      if (insertIndex < currentIndex) {
        const afterNode = childContainer.value!.children[insertIndex]
        childContainer.value!.insertBefore(node.el, afterNode)
      } else if (insertIndex > currentIndex) {
        const refNode = childContainer.value!.children[insertIndex]
        childContainer.value!.insertBefore(node.el, refNode.nextSibling)
      }
      children.value.sort(sortFunc)

      // 最年長ノードフラグを再設定
      restIsEldest()
    }

    function getInsertIndex(newNode: TreeNodeImpl, options?: { insertIndex?: number | null }): number {
      const sortFunc = getSortFunc()
      // ソート関数が指定されている場合
      if (sortFunc) {
        const newChildren: TreeNodeImpl[] = []
        if (children.value.includes(newNode)) {
          newChildren.push(...children.value)
        } else {
          newChildren.push(...children.value, newNode)
        }
        newChildren.sort(sortFunc)
        return newChildren.indexOf(newNode)
      }
      // 挿入位置が指定された場合
      else if (typeof options?.insertIndex === 'number') {
        return options.insertIndex
      }
      // 何も指定されていなかった場合
      else {
        return children.value.length
      }
    }

    /**
     * コンテナへノードを挿入します。
     * @param node 追加するノード
     * @param insertIndex ノード挿入位置
     */
    function insertChildIntoContainer(node: TreeNodeImpl, insertIndex: number): void {
      const childrenLength = childContainer.value!.children.length

      // 挿入位置が大きすぎないかを検証
      if (childrenLength < insertIndex) {
        throw new Error('insertIndex is too big.')
      }

      // コンテナにノードを追加
      if (childrenLength === insertIndex) {
        childContainer.value!.appendChild(node.el)
      } else {
        const afterNode = childContainer.value!.children[insertIndex]
        childContainer.value!.insertBefore(node.el, afterNode)
      }

      children.value.splice(insertIndex, 0, node)

      // ノードにツリービューを設定
      node.treeView = self

      // 最年長ノードフラグを再設定
      restIsEldest()
    }

    /**
     * コンテナからノードを削除します。
     * @node 削除するノード
     */
    function removeChildFromContainer(node: TreeNodeImpl): void {
      // ツリービューまたはツリービューの親がアンマウントされると、
      // ツリービュー内の要素を取得できない場合がある。このような状況を考慮し、
      // 要素の存在チェックをしてから指定されたノードの削除を行っている。
      childContainer.value && childContainer.value.removeChild(node.el)

      const index = children.value.indexOf(node)
      if (index >= 0) {
        children.value.splice(index, 1)
      }

      // ルートノードのツリービューをクリア
      node.treeView = null

      // 最年長ノードフラグを再設定
      restIsEldest()
    }

    /**
     * ノードが発火する標準のイベントとは別に、独自イベント用のリスナを登録します。
     * @param eventName
     */
    function addExtraNodeEventListener(eventName: string): void {
      childContainer.value!.removeEventListener(eventName, allNodesOnExtraEvent)
      childContainer.value!.addEventListener(eventName, allNodesOnExtraEvent)
    }

    /**
     * 最年長ノードフラグを再設定します。
     */
    function restIsEldest(): void {
      children.value.forEach((node, index) => {
        node.isEldest = index === 0
      })
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    /**
     * ノードでnode-property-changeイベントが発火した際のリスナです。
     * @param e
     */
    function allNodesOnNodePropertyChange(e: any) {
      e.stopImmediatePropagation()

      const node = e.detail.node as TreeNodeImpl
      const detail = e.detail as NodePropertyChangeDetail

      if (detail.property === 'value') {
        delete allNodeDict[detail.oldValue]
        allNodeDict[detail.newValue] = node
      }
    }

    /**
     * ツリービューにノードが追加された際のリスナです。
     * @param e
     */
    function onNodeAdd(e: any) {
      e.stopImmediatePropagation()

      const node = e.detail.node as TreeNodeImpl
      allNodeDict[node.value] = node

      // ノードが発火する独自イベントの設定
      for (const eventName of node.extraEventNames) {
        addExtraNodeEventListener(eventName)
      }

      // 追加されたノードが選択状態の場合
      if (node.selected) {
        // 選択処理が行われるよう次のメソッドを実行
        // ※選択系イベントが発生しないようにサイレントをオンで実行
        node.setSelected(true, true)
      }
    }

    /**
     * ツリービューからノードが削除される直前のリスナです。
     * @param e
     */
    function onBeforeNodeRemove(e: any) {
      e.stopImmediatePropagation()

      const node = e.detail.node as TreeNodeImpl

      // 削除ノード配下に選択ノードがあるかを走査
      for (const iNode of [node, ...node.getDescendants()]) {
        // 選択ノードがあった場合、選択解除処理が行われるよう次のメソッドを実行
        // ※選択系イベントを発生させるようサイレントをオフで実行
        iNode.selected && iNode.setSelected(false, false)
      }
    }

    /**
     * ツリービューからノードが削除された際のリスナです。
     * @param e
     */
    function onNodeRemove(e: any) {
      e.stopImmediatePropagation()

      const node = e.detail.node as TreeNodeImpl
      for (const descendant of util.getDescendants(node)) {
        delete allNodeDict[descendant.value]
      }
      delete allNodeDict[node.value]
    }

    /**
     * ノードでselect-changeイベントが発火した際のリスナです。
     * @param e
     */
    function allNodesOnSelectChange(e: any) {
      e.stopImmediatePropagation()

      const node = e.detail.node as TreeNodeImpl
      const silent = e.detail.silent

      // ノードが選択された場合
      if (node.selected) {
        // 新しい選択ノードを設定
        _selectedNode.value = node
      }
      // ノードの選択が解除された場合
      else {
        // 選択ノードをクリア
        _selectedNode.value = null
      }

      !silent && ctx.emit('select-change', { node } as TreeViewSelectEvent)
    }

    /**
     * ノードでselectイベントが発火した際のリスナです。
     * @param e
     */
    function allNodesOnSelect(e: any) {
      e.stopImmediatePropagation()

      const node = e.detail.node as TreeNodeImpl
      const oldNode = e.detail.oldNode as TreeNodeImpl | undefined
      const silent = e.detail.silent

      // イベントのノードを選択ノードに設定
      _selectedNode.value = node

      !silent && ctx.emit('select', { node, oldNode } as TreeViewEvent)
    }

    /**
     * ノードでopen-changeイベントが発火した際のリスナです。
     * @param e
     */
    function allNodesOnOpenChange(e: any) {
      e.stopImmediatePropagation()

      const node = e.detail.node as TreeNodeImpl
      ctx.emit('open-change', { node } as TreeViewEvent)
    }

    /**
     * ノードでnode-loadingイベントが発火した際のリスナです。
     * @param e
     */
    function allNodesOnLazyLoad(e: any) {
      e.stopImmediatePropagation()

      const node = e.detail.node as TreeNodeImpl
      const done = e.detail.done as TreeViewLazyLoadDoneFunc

      ctx.emit('lazy-load', { node, done } as TreeViewLazyLoadEvent)
    }

    /**
     * ノードが発火する標準のイベントとは別に、独自イベントが発火した際のリスナです。
     * @param e
     */
    function allNodesOnExtraEvent(e: any) {
      e.stopImmediatePropagation()

      const node = e.detail.node as TreeNodeImpl
      const args = { node }
      if (e.detail) {
        Object.assign(args, e.detail)
      }

      ctx.emit(e.type, args)
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      //--------------------------------------------------
      //  public
      //--------------------------------------------------

      children,
      selectedNode,
      setSelectedNode,
      getNodeClass,
      setNodeClass,
      getNode,
      getAllNodes,
      getSortFunc,
      setSortFunc,
      buildTree,
      addNode,
      removeNode,
      removeAllNodes,

      //--------------------------------------------------
      //  internal
      //--------------------------------------------------

      el,
      childContainer,
      sortChildren,
      resetNodePositionInParent,

      //--------------------------------------------------
      //  private
      //--------------------------------------------------

      minWidth,
      allNodesOnNodePropertyChange,
      onNodeAdd,
      onBeforeNodeRemove,
      onNodeRemove,
      allNodesOnSelectChange,
      allNodesOnSelect,
      allNodesOnOpenChange,
      allNodesOnLazyLoad,
    }
  }
}

export default TreeView.clazz
// eslint-disable-next-line no-undef
export { TreeView, TreeViewImpl }
</script>
