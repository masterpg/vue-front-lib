<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.node-container
  padding-top: var(--tree-distance, 6px)
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
    cursor: pointer
    &.anime
      transition: transform .5s

.item-container
  height: var(--tree-line-height, 26px)
  cursor: pointer
  white-space: nowrap
  &:hover
    .item
      text-decoration: underline
  &.selected
    .item
      color: var(--tree-selected-color, $pink-5)
  &.unselectable
    cursor: default
    .item
      color: var(--tree-unselectable-color, $grey-9)
    &:hover
      .item
        text-decoration: none

.child-container
  padding-left: var(--tree-indent, 16px)
  height: 0
  overflow: hidden
</style>

<template>
  <div ref="el" class="TreeNode">
    <!-- 自ノード -->
    <div ref="nodeContainer" class="node-container layout horizontal center" :class="{ eldest: isEldest }">
      <!-- 遅延ロードアイコン -->
      <div v-show="lazyLoadStatus === 'loading'" ref="lazyLoadIcon" class="icon-container">
        <LoadingSpinner size="20px" />
      </div>
      <!-- トグルアイコン -->
      <div v-show="lazyLoadStatus !== 'loading'" class="icon-container">
        <!-- トグルアイコン有り -->
        <template v-if="hasChildren">
          <q-icon
            name="arrow_right"
            size="26px"
            color="grey-6"
            class="toggle-icon"
            :class="[opened ? 'rotate-90' : '', hasToggleAnime ? 'anime' : '']"
            @click="toggleIconOnClick"
          />
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
          <q-icon :name="icon" :color="iconColor" :size="iconSize" />
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
import * as util from './base'
import { ChildrenSortFunc, TreeNodeData, TreeNodeEditData, TreeViewLazyLoadStatus } from '@/app/components/tree-view/base'
import { Ref, SetupContext, computed, defineComponent, getCurrentInstance, nextTick, reactive, ref, set } from '@vue/composition-api'
import { TreeView, TreeViewImpl } from '@/app/components/tree-view/tree-view.vue'
import { extendedMethod, isFontAwesome } from '@/app/base'
import { LoadingSpinner } from '@/app/components/loading-spinner'
import Vue from 'vue'
import anime from 'animejs'
import debounce from 'lodash/debounce'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TreeNode<DATA extends TreeNodeData = TreeNodeData> extends Vue {
  /**
   * ラベルです。
   */
  label: string
  /**
   * ノードを特定するための値です。
   */
  value: string
  /**
   * アイテムの開閉です。
   */
  readonly opened: boolean
  /**
   * 選択されているか否かです。
   */
  selected: boolean
  /**
   * 選択状態を設定します。
   * @param selected 選択状態を指定
   * @param silent 選択系イベントを発火させたくない場合はtrueを指定
   */
  setSelected(selected: boolean, silent: boolean): void
  /**
   * 選択不可フラグです。
   * true: 選択不可, false: 選択可
   */
  unselectable: boolean
  /**
   * 親ノードです。
   */
  readonly parent: this | null
  /**
   * 子ノードです。
   */
  readonly children: this[]
  /**
   * アイコン名です。
   * https://material.io/tools/icons/?style=baseline
   */
  icon: string
  /**
   * アイコンの色です。
   * 例: 'primary' or 'indigo-8' or '#303f9f'
   */
  iconColor: string
  /**
   * アイコンのサイズです。デフォルトは'24px'です。
   * 例: '24px'
   */
  iconSize: string
  /**
   * 子ノードの読み込みを遅延ロードするか否かです。
   */
  lazy: boolean
  /**
   * 子ノード読み込みの遅延ロード状態です。
   */
  lazyLoadStatus: TreeViewLazyLoadStatus
  /**
   * 自身が最年長のノードかを示すフラグです。
   */
  readonly isEldest: boolean
  /**
   * ノードの最小幅です。
   */
  readonly minWidth: number
  /**
   * 子ノードの並びを決めるソート関数を取得します。
   */
  getSortFunc<N extends TreeNode = this>(): ChildrenSortFunc<N> | null
  /**
   * 子ノードの並びを決めるソート関数を設定します。
   */
  setSortFunc(value: ChildrenSortFunc<this> | null): void
  /**
   * 本ノードが所属するツリービューを取得します。
   */
  getTreeView(): TreeView | null
  /**
   * ルートノードを取得します。
   */
  getRootNode(): this
  /**
   * 子孫ノードを取得します。
   */
  getDescendants(): this[]
  /**
   * ノードを編集するためのデータを設定します。
   * @param editData
   */
  setNodeData(editData: TreeNodeEditData<DATA>): void
  /**
   * 子ノードを追加します。
   * @param child 追加するノード
   * @param options
   * <ul>
   *   <li>insertIndex: ノード挿入位置。ノードに`sortFunc`が設定されている場合、この値は無視されます。</li>
   * </ul>
   */
  addChild(child: this, options?: { insertIndex?: number | null }): this
  /**
   * 子ノードを追加します。
   * @param child 追加ノードを構築するためのデータ
   * @param options
   * <ul>
   *   <li>insertIndex: ノード挿入位置。ノードに`sortFunc`が設定されている場合、この値は無視されます。</li>
   * </ul>
   */
  addChild(child: DATA, options?: { insertIndex?: number | null }): this
  /**
   * 子ノードを削除します。
   * @param childNode
   */
  removeChild(childNode: this): void
  /**
   * 全ての子ノードを削除します。
   */
  removeAllChildren(): void
  /**
   * 子ノードの開閉をトグルします。
   * @param animate
   */
  toggle(animate?: boolean): void
  /**
   * 子ノードを展開します。
   * @param animate
   */
  open(animate?: boolean): void
  /**
   * 子ノードを閉じます。
   * @param animate
   */
  close(animate?: boolean): void
}

interface TreeNodeImpl<DATA extends TreeNodeData = TreeNodeData> extends TreeNode<DATA> {
  parent: this | null
  isEldest: boolean
  getTreeView(): TreeViewImpl | null
  setTreeView(value: TreeViewImpl | null): void
  readonly el: HTMLElement
  readonly childContainer: HTMLElement
  readonly nodeData: Required<DATA>
  readonly extraEventNames: string[]
  init(nodeData: DATA): void
  sortChildren(): void
  removeChildImpl(childNode: this, isDispatchEvent: boolean): boolean
  resetNodePositionInParent(node: TreeNodeImpl): void
  refreshChildContainerHeight(): void
  refreshChildContainerHeightWithAnimation(): Promise<void>
  getChildrenContainerHeight(base: this): number
  getInsertIndex(newNode: this, options?: { insertIndex?: number | null }): number
  ascendSetBlockForDisplay(): void
  ascendSetAnyForDisplay(): void
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TreeNode {
  export const clazz = defineComponent({
    name: 'TreeNode',

    components: {
      LoadingSpinner: LoadingSpinner.clazz,
    },

    setup: (props: {}, ctx) => setup(props, ctx),
  })

  export function setup(props: {}, ctx: SetupContext) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const self = getCurrentInstance() as TreeNodeImpl
    const el = ref<HTMLElement>()
    const nodeContainer = ref<HTMLElement>()
    const childContainer = ref<HTMLElement>()
    const lazyLoadIcon = ref<HTMLElement>()

    const state = reactive({
      isEldest: false,
      minWidth: 0,
      toggleAnime: null as { resolve: () => void; anime: anime.AnimeInstance } | null,
      extraEventNames: [] as string[],
    })

    const _nodeData: Ref<Required<TreeNodeData>> = ref({} as any)
    const nodeData = computed({
      get: () => _nodeData.value,
      set: value => (_nodeData.value = value),
    })

    const _treeView: Ref<TreeViewImpl | null> = ref(null)
    const treeView = computed({
      get: () => _treeView.value,
      set: value => (_treeView.value = value),
    })

    /**
     * ノードが発火する標準のイベントとは別に、独自で発火するイベント名のリストです。
     * TreeNodeを拡張し、そのノードで独自イベントを発火するよう実装した場合、
     * このプロパティに独自イベント名を設定してください。
     */
    const extraEventNames = computed(() => state.extraEventNames)

    const hasChildren = computed(() => {
      // 遅延ロードが指定され、かつまだロードされていない場合
      if (lazy.value && lazyLoadStatus.value === 'none') {
        // 子ノードが存在すると仮定する
        return true
      }
      // 上記以外の場合
      else {
        // 実際に子ノードが存在するかを判定する
        return children.value.length > 0
      }
    })

    const hasToggleAnime = computed(() => Boolean(state.toggleAnime))

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const label = computed({
      get: () => nodeData.value.label,
      set: value => {
        const oldValue = nodeData.value.label
        nodeData.value.label = value
        util.dispatchNodePropertyChange(self, { property: 'label', newValue: value, oldValue })
        resetNodePositionInParentDebounce(self)

        nextTick(() => {
          setMinWidth()
        })
      },
    })

    const value = computed({
      get: () => nodeData.value.value,
      set: value => {
        const oldValue = nodeData.value.value
        nodeData.value.value = value
        util.dispatchNodePropertyChange(self, { property: 'value', newValue: value, oldValue })
        resetNodePositionInParentDebounce(self)
      },
    })

    const opened = computed(() => nodeData.value.opened)

    const selected = computed({
      get: () => nodeData.value.selected,
      set: value => {
        setSelectedImpl(value, { silent: false })
        resetNodePositionInParentDebounce(self)
      },
    })

    const setSelected: TreeNodeImpl['setSelected'] = (selected, silent) => {
      setSelectedImpl(selected, { silent })
      resetNodePositionInParentDebounce(self)
    }

    const unselectable = computed({
      get: () => nodeData.value.unselectable,
      set: value => {
        nodeData.value.unselectable = value
        if (value) {
          selected.value = false
        }
        resetNodePositionInParentDebounce(self)
      },
    })

    const _parent: Ref<TreeNodeImpl | null> = ref(null)
    const parent = computed({
      get: () => _parent.value,
      set: value => (_parent.value = value),
    })

    const children: Ref<TreeNodeImpl[]> = ref([])

    const icon = computed({
      get: () => nodeData.value.icon,
      set: value => {
        nodeData.value.icon = value
        resetNodePositionInParentDebounce(self)
      },
    })

    const iconColor = computed({
      get: () => nodeData.value.iconColor,
      set: value => {
        nodeData.value.iconColor = value
        resetNodePositionInParentDebounce(self)
      },
    })

    const iconSize = computed({
      get: () => nodeData.value.iconSize,
      set: value => {
        nodeData.value.iconSize = value
        resetNodePositionInParentDebounce(self)
      },
    })

    const lazy = computed({
      get: () => nodeData.value.lazy,
      set: value => {
        nodeData.value.lazy = value
        resetNodePositionInParentDebounce(self)
      },
    })

    const lazyLoadStatus = computed({
      get: () => nodeData.value.lazyLoadStatus,
      set: value => {
        nodeData.value.lazyLoadStatus = value
        resetNodePositionInParentDebounce(self)
      },
    })

    const isEldest = computed({
      get: () => state.isEldest,
      set: value => (state.isEldest = value),
    })

    const minWidth = computed(() => {
      setMinWidth()
      return state.minWidth
    })

    function setMinWidth(): void {
      // ノードコンテナの幅を取得
      let nodeContainerWidth = 0
      for (const el of Array.from(nodeContainer.value!.children)) {
        nodeContainerWidth += util.getElementWidth(el)
      }
      nodeContainerWidth += util.getElementFrameWidth(nodeContainer.value!)

      // 子ノードの中で最大幅のものを取得
      let childContainerWidth = 0
      if (opened.value) {
        for (const child of children.value) {
          if (childContainerWidth < child.minWidth) {
            childContainerWidth = child.minWidth
            childContainerWidth += util.getElementFrameWidth(childContainer.value!)
          }
        }
      }

      // 上記で取得したノードコンテナ幅と子ノードコンテナ幅を比較し、大きい方を採用する
      state.minWidth = nodeContainerWidth >= childContainerWidth ? nodeContainerWidth : childContainerWidth
    }

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const getSortFunc: TreeNodeImpl['getSortFunc'] = () => {
      if (nodeData.value.sortFunc) {
        return nodeData.value.sortFunc
      }

      const treeView = getTreeView()
      const sortFunc = treeView?.getSortFunc() ?? null
      return sortFunc as ChildrenSortFunc<any> | null
    }

    const setSortFunc: TreeNodeImpl['setSortFunc'] = value => {
      nodeData.value.sortFunc = value ?? null
      if (children.value.length) {
        sortChildren()
      }
    }

    const getTreeView: TreeNodeImpl['getTreeView'] = () => {
      const rootNode = getRootNode()
      if (self === rootNode) {
        return treeView.value
      } else {
        return rootNode.getTreeView()
      }
    }

    const getRootNode: TreeNodeImpl['getRootNode'] = () => {
      if (parent.value) {
        return parent.value.getRootNode()
      }
      return self
    }

    const getDescendants: TreeNodeImpl['getDescendants'] = () => {
      return util.getDescendants(self)
    }

    const setTreeView: TreeNodeImpl['setTreeView'] = value => {
      // 自身がルートノードではない場合にツリービューが設定されようとした場合
      // ※ツリービューの設定はルートノードのみに行われます。
      if (parent.value) {
        throw new Error(`A 'treeView' is about to be set when it is not the root node.`)
      }

      treeView.value = value
    }

    const setNodeData: TreeNodeImpl['setNodeData'] = editData => {
      if (typeof editData.label === 'string') {
        label.value = editData.label!
      }

      if (typeof editData.value === 'string') {
        value.value = editData.value
      }

      if (typeof editData.unselectable === 'boolean') {
        unselectable.value = editData.unselectable
      }

      if (typeof editData.selected === 'boolean') {
        selected.value = editData.selected
      }

      if (typeof editData.icon === 'string') {
        icon.value = editData.icon
      }

      if (typeof editData.iconColor === 'string') {
        iconColor.value = editData.iconColor
      }

      if (typeof editData.iconSize === 'string') {
        iconSize.value = editData.iconSize
      }

      if (typeof editData.opened === 'boolean') {
        if (editData.opened) {
          open(false)
        } else {
          close(false)
        }
      }

      if (typeof editData.lazy === 'boolean') {
        lazy.value = editData.lazy
      }

      if (typeof editData.lazyLoadStatus === 'string') {
        lazyLoadStatus.value = editData.lazyLoadStatus!
      }

      // サブクラスで必要な処理を実行
      setNodeData_sub.value(editData)

      // 親コンテナ内における自身の配置位置を再設定
      resetNodePositionInParent(self)
    }

    /**
     * このコンポーネントを拡張したサブコンポーネントで`setNodeData()`に追加で処理が必要な場合、
     * その追加処理を記述するためのプレースホルダー関数になります。
     */
    const setNodeData_sub = extendedMethod<(nodeData: TreeNodeEditData<TreeNodeData>) => void>(() => {})

    const addChild: TreeNodeImpl['addChild'] = (child: any, options?: { insertIndex?: number | null }) => {
      let childNode: TreeNodeImpl
      const childType = child instanceof Vue ? 'Node' : 'Data'

      switch (childType) {
        // 引数のノードがノードコンポーネントで指定された場合
        case 'Node': {
          childNode = addChildByNode(child as TreeNodeImpl, options)
          break
        }
        // 引数のノードがノードデータで指定された場合
        case 'Data': {
          childNode = addChildByData(child as TreeNodeData, options)
        }
      }

      return childNode
    }

    const removeChild: TreeNodeImpl['removeChild'] = childNode => {
      removeChildImpl(childNode, true)
    }

    const removeAllChildren: TreeNodeImpl['removeAllChildren'] = () => {
      for (const node of [...children.value]) {
        removeChild(node)
      }
    }

    const toggle: TreeNodeImpl['toggle'] = (animate = true) => {
      toggleImpl(!opened.value, animate)
    }

    const open: TreeNodeImpl['open'] = (animate = true) => {
      if (nodeData.value.opened) return
      toggleImpl(true, animate)
    }

    const close: TreeNodeImpl['close'] = (animate = true) => {
      if (!nodeData.value.opened) return
      toggleImpl(false, animate)
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    /**
     * ノードの初期化を行います。
     * @param data
     */
    const init: TreeNodeImpl['init'] = data => {
      // 任意項目は値が設定されていないとリアクティブにならないのでここで初期化
      set(data, 'icon', data.icon || '')
      set(data, 'iconColor', data.iconColor || '')
      set(data, 'iconSize', data.iconSize || isFontAwesome(data.icon) ? '20px' : '24px')
      set(data, 'opened', Boolean(data.opened))
      set(data, 'unselectable', Boolean(data.unselectable))
      set(data, 'selected', Boolean(data.selected))
      set(data, 'children', data.children || [])
      set(data, 'lazy', Boolean(data.lazy))
      set(data, 'lazyLoadStatus', data.lazyLoadStatus || 'none')
      set(data, 'sortFunc', data.sortFunc || null)
      nodeData.value = data as Required<TreeNodeData>

      // サブクラスで必要な処理を実行
      init_sub.value(nodeData.value)

      setSelectedImpl(nodeData.value.selected, { initializing: true })
    }

    /**
     * このコンポーネントを拡張したサブコンポーネントで`init()`に追加で処理が必要な場合、
     * その追加処理を記述するためのプレースホルダー関数になります。
     */
    const init_sub = extendedMethod<(nodeData: TreeNodeData) => void>(() => {})

    const sortChildren: TreeNodeImpl['sortChildren'] = () => {
      const sortFunc = getSortFunc()
      if (!sortFunc) return

      children.value.sort(sortFunc)
      for (const child of children.value) {
        childContainer.value!.appendChild(child.el)
      }
    }

    /**
     * 子ノードを削除します。
     * @param childNode
     * @param isDispatchEvent 削除イベントを発火するか否かを指定
     * @return 削除された場合はtrue, 削除対象のノードがなく削除が行われなかった場合はfalse
     */
    const removeChildImpl: TreeNodeImpl['removeChildImpl'] = (childNode, isDispatchEvent) => {
      const index = children.value.indexOf(childNode)
      if (index >= 0) {
        isDispatchEvent && util.dispatchBeforeNodeRemove(self, childNode)
        childNode.parent = null
        children.value.splice(index, 1)
        nodeData.value.children.splice(index, 1)
        removeChildFromContainer(childNode)
        refreshChildContainerHeight()
        isDispatchEvent && util.dispatchNodeRemove(self, childNode)
        return true
      }
      return false
    }

    /**
     * 指定ノードの親コンテナ内における配置位置を再設定します。
     * この関数は以下の条件に一致する場合に呼び出す必要があります。
     * + 親ノードがソート関数によって子ノードの並びを決定している場合
     * + 指定ノードのプロパティ変更がソート関数に影響を及ぼす場合
     * @param node
     */
    const resetNodePositionInParent: TreeNodeImpl['resetNodePositionInParent'] = node => {
      if (node.parent) {
        // 親ノードまたはツリービューにソート関数が指定されていない場合、何もしない
        const sortFunc = node.parent.getSortFunc()
        if (!sortFunc) return

        const insertIndex = node.parent.getInsertIndex(node)
        const currentIndex = node.parent.children.indexOf(node)
        if (insertIndex === currentIndex) return

        if (insertIndex < currentIndex) {
          const afterNode = node.parent.childContainer.children[insertIndex]
          node.parent.childContainer.insertBefore(node.el, afterNode)
        } else if (insertIndex > currentIndex) {
          const refNode = node.parent.childContainer.children[insertIndex]
          node.parent.childContainer.insertBefore(node.el, refNode.nextSibling)
        }
        node.parent.children.sort(sortFunc)
      } else {
        const treeView = getTreeView()
        treeView?.resetNodePositionInParent(node)
      }
    }

    const resetNodePositionInParentDebounce = debounce(resetNodePositionInParent, 0)

    /**
     * 子ノードが配置されるコンテナの高さを再計算し、高さをリフレッシュします。
     * (アニメーションなしで)
     */
    const refreshChildContainerHeight: TreeNodeImpl['refreshChildContainerHeight'] = () => {
      ascendSetBlockForDisplay()

      // 子ノードコンテナの高さを取得
      const newHeight = getChildrenContainerHeight(self)

      // 子ノードコンテナの高さを設定
      childContainer.value!.style.height = `${newHeight}px`

      // 親ノードの高さも再計算して、高さをリフレッシュ
      parent.value && parent.value.refreshChildContainerHeight()

      ascendSetAnyForDisplay()
    }

    /**
     * 子ノードが配置されるコンテナの高さを再計算し、高さをリフレッシュします。
     * (アニメーションしながら)
     */
    const refreshChildContainerHeightWithAnimation: TreeNodeImpl['refreshChildContainerHeightWithAnimation'] = () => {
      const DURATION = 500

      return new Promise<void>(resolve => {
        // アニメーションが実行中の場合は停止
        if (state.toggleAnime) {
          state.toggleAnime.anime.pause()
          state.toggleAnime.resolve()
          state.toggleAnime = null
        }

        ascendSetBlockForDisplay()

        // 子ノードコンテナの高さを取得
        const newHeight = getChildrenContainerHeight(self)

        // アニメーションを実行
        const toggleAnime = anime({
          targets: childContainer.value,
          height: `${newHeight}px`,
          duration: DURATION,
          easing: 'easeOutCubic',
          complete: () => {
            state.toggleAnime = null
            ascendSetAnyForDisplay()
            resolve()
          },
        })

        // 実行中アニメーションの情報を保存
        state.toggleAnime = { resolve, anime: toggleAnime }

        // 親ノードの高さも再計算して、高さをリフレッシュ
        parent.value && parent.value.refreshChildContainerHeightWithAnimation()
      })
    }

    /**
     * 子ノードが配置されるコンテナの高さを算出します。
     * @param base 基準となるノードを指定します。このノードの子孫を走査して高さが算出されます。
     */
    const getChildrenContainerHeight: TreeNodeImpl['getChildrenContainerHeight'] = base => {
      let result = 0

      if (opened.value) {
        result += util.getElementFrameHeight(childContainer.value!)
        for (const child of children.value) {
          result += child.getChildrenContainerHeight(base)
        }
      }

      // 基準ノードの高さは排除したいためのif文
      if (self !== base) {
        result += nodeContainer.value!.getBoundingClientRect().height
      }

      return result
    }

    const getInsertIndex: TreeNodeImpl['getInsertIndex'] = (newNode, options) => {
      const sortFunc = getSortFunc()
      // 親ノードまたはツリービューにソート関数が指定されている場合
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
     * 自ノードから上位ノードに向かって再帰的に「display: block」を設定します。
     *
     * ※このメソッドの存在理由:
     * 自ノードに子ノードを追加する際、いずれかの祖先が「display: none」だと
     * 追加する子ノードのサイズが決定されないため、ノードの高さなどサイズ調整
     * をすることができません。この対応として一時的に上位ノードに「display: block」
     * を設定することでサイズ調整が可能になります。
     */
    const ascendSetBlockForDisplay: TreeNodeImpl['ascendSetBlockForDisplay'] = () => {
      childContainer.value!.style.display = 'block'
      if (parent.value) {
        parent.value.ascendSetBlockForDisplay()
      }
    }

    /**
     * 自ノードから上位ノードに向かって再帰的に適切な「display: [any]」を設定します。
     *
     * ※このメソッドの役割:
     * `ascendSetBlockForDisplay()`によって一時的に「display: block」にされていた値を
     * 適切な値に設定し直す役割をします。
     */
    const ascendSetAnyForDisplay: TreeNodeImpl['ascendSetAnyForDisplay'] = () => {
      childContainer.value!.style.display = opened.value ? 'block' : 'none'
      if (parent.value) {
        parent.value.ascendSetAnyForDisplay()
      }
    }

    function dispatchExtraEvent<T>(extraEventName: string, detail?: T): void {
      util.dispatchExtraEvent(self, extraEventName, detail)
    }

    /**
     * 選択状態の設定を行います。
     * @param selected
     * @param options
     * <ul>
     *   <li>initializing 初期化中か否かを指定</li>
     *   <li>silent 選択イベントを発火したくない場合はtrueを指定</li>
     * </ul>
     */
    function setSelectedImpl(selected: boolean, options: { initializing?: boolean; silent?: boolean } = {}): void {
      const initializing = typeof options.initializing === 'boolean' ? options.initializing : false
      const silent = typeof options.silent === 'boolean' ? options.silent : false
      const changed = nodeData.value.selected !== selected
      const oldNode = getTreeView()?.selectedNode

      // 選択不可の場合
      if (unselectable.value) {
        // 選択解除に変更された場合
        // ※選択不可ノードを選択状態へ変更しようとしてもこのブロックには入らない
        if (changed && !selected) {
          nodeData.value.selected = false
          !initializing && util.dispatchSelectChange(self, silent)
        }
      }
      // 選択可能な場合
      else {
        // 選択状態が変更された場合
        if (changed) {
          function onChanged(): void {
            // 自ノードが選択状態へ変更されるので、古い選択ノードの選択は解除
            !initializing && selected && oldNode?.setSelected(false, silent)

            nodeData.value.selected = selected
            // select-changeイベントを発火
            !initializing && util.dispatchSelectChange(self, silent)
            // 自ノードが選択状態へ変更される場合に限り、selectイベントを発火
            !initializing && selected && util.dispatchSelect(self, oldNode, silent)
          }

          // 遅延ロードが必要な場合
          // ※遅延ロードが指定され、かつまだロードが開始されていない場合
          if (lazy.value && lazyLoadStatus.value === 'none') {
            startLazyLoad(onChanged)
          }
          // 遅延ロードの必要がない場合
          else {
            onChanged()
          }
        }
        // 選択状態が変更されなかった場合
        else {
          // 自ノードが選択状態へ変更される場合に限り、selectイベントを発火
          !initializing && selected && util.dispatchSelect(self, oldNode, silent)
        }
      }
    }

    function addChildByData(childNodeData: TreeNodeData, options?: { insertIndex?: number | null }): TreeNodeImpl {
      const treeView = getTreeView()
      if (!treeView) {
        throw new Error(`'treeView' not found.`)
      }

      if (treeView.getNode(childNodeData.value)) {
        throw new Error(`The node '${childNodeData.value}' already exists.`)
      }

      ascendSetBlockForDisplay()

      // 子ノードの作成
      const childNode = util.newTreeNode(childNodeData, treeView.getNodeClass())

      // ノード挿入位置を決定
      const insertIndex = getInsertIndex(childNode, options)

      // コンテナにノードを追加
      insertChildIntoContainer(childNode, insertIndex)

      // コンテナの高さを設定
      if (opened.value) {
        const childrenContainerHeight = getChildrenContainerHeight(self)
        const childNodeHeight = childrenContainerHeight + childNode.el.getBoundingClientRect().height
        childContainer.value!.style.height = `${childNodeHeight}px`
      }

      // ノードの親子関係を設定
      childNode.parent = self
      children.value.splice(insertIndex, 0, childNode)
      if (!nodeData.value.children.find(data => data.value === childNode.value)) {
        nodeData.value.children.splice(insertIndex, 0, childNode.nodeData)
      }

      // 親ノードのコンテナの高さを設定
      if (parent.value) {
        parent.value.refreshChildContainerHeight()
      }

      // 子ノードの設定
      const len = childNodeData.children ? childNodeData.children.length : 0
      for (let i = 0; i < len; i++) {
        childNode.addChild(childNodeData.children![i], { insertIndex: i })
      }

      ascendSetAnyForDisplay()

      // ノードが追加されたことを通知するイベントを発火
      util.dispatchNodeAdd(childNode)

      return childNode
    }

    function addChildByNode(childNode: TreeNodeImpl, options?: { insertIndex?: number | null }): TreeNodeImpl {
      // 追加ノードの子に自ノードが含まれないことを検証
      const descendantDict = util.getDescendantDict(childNode)
      if (descendantDict[value.value]) {
        throw new Error(`The specified node '${childNode.value}' contains the new parent '${value.value}'.`)
      }

      // 追加ノードの親が自ノードの場合
      // ※自ノードの子として追加ノードが既に存在する場合
      if (childNode.parent === self) {
        const newInsertIndex = getInsertIndex(childNode, options)
        const currentIndex = children.value.indexOf(childNode)
        // 現在の位置と新しい挿入位置が同じ場合
        if (currentIndex === newInsertIndex) {
          util.dispatchNodeAdd(childNode)
          for (const descendant of util.getDescendants(childNode)) {
            util.dispatchNodeAdd(descendant)
          }
          return childNode
        }
      }

      ascendSetBlockForDisplay()

      //
      // 前の親から追加ノードを削除
      //
      if (childNode.parent) {
        // 前の親ノードから追加ノードを削除
        childNode.parent.removeChildImpl(childNode, false)
      } else {
        // 親ノードがない場合ツリービューが親となるので、ツリービューから追加ノードを削除
        const treeView = getTreeView()
        treeView?.removeNode(childNode.value)
      }

      // ノード挿入位置を決定
      const insertIndex = getInsertIndex(childNode, options)

      // コンテナにノードを追加
      insertChildIntoContainer(childNode, insertIndex)

      // コンテナの高さを設定
      if (opened.value) {
        const childrenContainerHeight = getChildrenContainerHeight(self)
        const childNodeHeight = childrenContainerHeight + childNode.el.getBoundingClientRect().height
        childContainer.value!.style.height = `${childNodeHeight}px`
      }

      // ノードの親子関係を設定
      childNode.parent = self
      children.value!.splice(insertIndex, 0, childNode)
      if (!nodeData.value.children.find(data => data.value === childNode.value)) {
        nodeData.value.children.splice(insertIndex, 0, childNode.nodeData)
      }

      // 親ノードのコンテナの高さを設定
      if (parent.value) {
        parent.value.refreshChildContainerHeight()
      }

      // 子ノードの設定
      for (let i = 0; i < childNode.children.length; i++) {
        const descendant = childNode.children[i]
        childNode.addChild(descendant, { insertIndex: i })
      }

      ascendSetAnyForDisplay()

      // ノードが追加されたことを通知するイベントを発火
      util.dispatchNodeAdd(childNode)

      return childNode
    }

    /**
     * 子コンテナからノードを削除します。
     * @param node
     */
    function removeChildFromContainer(node: TreeNodeImpl): void {
      childContainer.value!.removeChild(node.el)
    }

    /**
     * 子コンテナへノードを挿入します。
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
    }

    function toggleImpl(newOpened: boolean, animate: boolean): void {
      // 遅延ロードが指定され、かつまだロードされていない場合
      if (lazy.value && lazyLoadStatus.value === 'none') {
        startLazyLoad(() => {
          toggleImpl(newOpened, animate)
        })
      }
      // 上記以外の場合
      else {
        const changed = opened.value !== newOpened
        nodeData.value.opened = newOpened

        if (animate) {
          refreshChildContainerHeightWithAnimation()
        } else {
          refreshChildContainerHeight()
        }

        if (changed) {
          util.dispatchOpenChange(self)
        }
      }
    }

    /**
     * 子ノードを取得するための遅延ロードを開始します。
     * @param completed 遅延ロードが完了した際に実行されるコールバック関数を指定
     */
    function startLazyLoad(completed: () => void): void {
      lazyLoadStatus.value = 'loading'
      util.dispatchLazyLoad(self, () => {
        anime({
          targets: lazyLoadIcon.value!,
          opacity: '0',
          duration: 150,
          easing: 'easeOutCubic',
          complete: () => {
            lazyLoadIcon.value!.style.opacity = '1'
            lazyLoadStatus.value = 'loaded'
            completed()
          },
        })
      })
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    /**
     * トグルアイコンのクリック時のリスナです。
     */
    function toggleIconOnClick() {
      toggle()
    }

    /**
     * アイテム部分のクリック時のリスナです。
     */
    function itemContainerOnClick() {
      selected.value = true
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

      label,
      value,
      opened,
      selected,
      setSelected,
      unselectable,
      parent,
      children,
      icon,
      iconColor,
      iconSize,
      lazy,
      lazyLoadStatus,
      isEldest,
      minWidth,
      getSortFunc,
      setSortFunc,
      getTreeView,
      getRootNode,
      getDescendants,
      setNodeData,
      addChild,
      removeChild,
      removeAllChildren,
      toggle,
      open,
      close,

      //--------------------------------------------------
      //  internal
      //--------------------------------------------------

      setTreeView,
      el,
      childContainer,
      nodeData,
      extraEventNames,
      init,
      sortChildren,
      removeChildImpl,
      resetNodePositionInParent,
      refreshChildContainerHeight,
      refreshChildContainerHeightWithAnimation,
      getChildrenContainerHeight,
      getInsertIndex,
      ascendSetBlockForDisplay,
      ascendSetAnyForDisplay,

      //--------------------------------------------------
      //  extended
      //--------------------------------------------------

      hasChildren,
      init_sub,
      setNodeData_sub,
      dispatchExtraEvent,
      resetNodePositionInParentDebounce,
      toggleIconOnClick,
      itemContainerOnClick,

      //--------------------------------------------------
      //  private
      //--------------------------------------------------

      nodeContainer,
      lazyLoadIcon,
      hasToggleAnime,
    }
  }
}

export default TreeNode.clazz
// eslint-disable-next-line no-undef
export { TreeNode, TreeNodeImpl }
</script>
