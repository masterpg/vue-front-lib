import CompTreeNode from './comp-tree-node.vue'
import { Constructor } from 'web-base-lib'

export interface CompTreeNodeData {
  /**
   * ノードのラベルを指定します。
   */
  label: string
  /**
   * ノードがを特定するための値を指定します。
   */
  value: string
  /**
   * 非選択なノードか否かを指定します。
   * デフォルトは選択可能なので、非選択にしたい場合にtrueを設定します。
   */
  unselectable?: boolean
  /**
   * ノードが選択されているか否かを指定します。
   */
  selected?: boolean
  /**
   * ノードが開いているか否かを指定します。
   * デフォルトは閉じているので、開いた状態にしたい場合にtrueを設定します。
   */
  opened?: boolean
  /**
   * アイコン名を指定します。
   * https://material.io/tools/icons/?style=baseline
   */
  icon?: string
  /**
   * アイコンの色を指定します。
   * 例: primary, indigo-8
   */
  iconColor?: string
  /**
   * CompTreeNodeを拡張した場合、拡張したノードのクラスを指定します。
   */
  nodeClass?: Constructor
  /**
   * 子ノードを指定します。
   */
  children?: this[]
  /**
   * 子ノードの読み込みを遅延ロードするか否かを指定します。
   */
  lazy?: boolean
  /**
   * 子ノード読み込みの遅延ロード状態を指定します。
   */
  lazyLoadStatus?: CompTreeViewLazyLoadStatus
  /**
   * 子ノードの並びを決めるソート関数を指定します。
   */
  sortFunc?: ChildrenSortFunc
}

export type CompTreeNodeEditData<T> = Partial<Omit<T, 'nodeClass' | 'children'>>

export type ChildrenSortFunc = (a: CompTreeNode, b: CompTreeNode) => number

export interface CompTreeCheckboxNodeData extends CompTreeNodeData {
  checked?: boolean
}

export type CompTreeViewLazyLoadStatus = 'none' | 'loading' | 'loaded'

export type CompTreeViewLazyLoadDoneFunc = () => void

export interface CompTreeViewLazyLoadEvent<NODE extends CompTreeNode = any> {
  node: NODE
  done: CompTreeViewLazyLoadDoneFunc
}

export interface CompTreeNodeParent {
  readonly children: CompTreeNode[]
  readonly sortFunc: ChildrenSortFunc | null
  readonly m_childContainer: HTMLElement
  m_getInsertIndex(newNode: CompTreeNode, options?: { insertIndex?: number | null }): number
}
