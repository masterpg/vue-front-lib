import { AuthStatus, StorageNodeType } from '@/app/logic/types'
import { Component } from 'vue-property-decorator'
import Vue from 'vue'
import { config } from '@/app/config'
import { removeEndSlash } from 'web-base-lib'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface SortStorageNode {
  nodeType: StorageNodeType
  name: string
  dir: string
  path: string
  articleSortOrder?: number | null
}

interface SortTreeNode<NODE extends SortStorageNode> {
  item: NODE
  parent?: SortTreeNode<NODE>
  children: SortTreeNode<NODE>[]
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class BaseLogicStore extends Vue {
  m_db: firebase.firestore.Firestore | null = null

  get db(): firebase.firestore.Firestore {
    if (!this.m_db) this.m_db = firebase.firestore()
    return this.m_db
  }

  authStatus: AuthStatus = AuthStatus.None
}

const logicStore = new BaseLogicStore()

abstract class BaseLogic extends Vue {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected get db(): firebase.firestore.Firestore {
    return logicStore.db
  }

  protected get authStatus(): AuthStatus {
    return logicStore.authStatus
  }

  protected setAuthStatus(value: AuthStatus): void {
    logicStore.authStatus = value
  }

  protected get isSignedIn(): boolean {
    return this.authStatus === AuthStatus.Available
  }
}

/**
 * ノード配列をディレクトリ階層に従ってソートする関数です。
 * ※この関数では記事系ノードを適切にソートすることはできません。
 */
const storageTreeSortFunc = <NODE extends SortStorageNode>(a: NODE, b: NODE) => {
  // ソート用文字列(strA, strB)の説明:
  //   ノードがファイルの場合、同じ階層にあるディレクトリより順位を下げるために
  //   大きな文字コード'0xffff'を付加している。これにより同一階層のファイルと
  //   ディレクトリを比較した際、ファイルの方が文字的に大きいと判断され、下の方へ
  //   配置されることになる。

  let strA = a.path
  let strB = b.path
  if (a.nodeType === StorageNodeType.File) {
    strA = `${a.dir}${String.fromCodePoint(0xffff)}${a.name}`
  }
  if (b.nodeType === StorageNodeType.File) {
    strB = `${b.dir}${String.fromCodePoint(0xffff)}${b.name}`
  }

  return strA < strB ? -1 : strA > strB ? 1 : 0
}

/**
 * ノード配列をディレクトリ階層に従ってソートします。
 * @param nodes
 */
function sortStorageTree<NODE extends SortStorageNode>(nodes: NODE[]): NODE[] {
  nodes.sort(storageTreeSortFunc)

  const topTreeNodes: SortTreeNode<NODE>[] = []
  const treeNodeDict: { [path: string]: SortTreeNode<NODE> } = {}
  for (const node of nodes) {
    const parent = treeNodeDict[node.dir]
    const treeNode: SortTreeNode<NODE> = { item: node, parent, children: [] }
    treeNodeDict[node.path] = treeNode
    if (parent) {
      parent.children.push(treeNode)
    } else {
      topTreeNodes.push(treeNode)
    }
  }

  nodes.splice(0)

  const sort = (treeNodes: SortTreeNode<NODE>[]) => {
    treeNodes.sort((treeNodeA, treeNodeB) => {
      const a = treeNodeA.item
      const b = treeNodeB.item
      if (a.nodeType === b.nodeType) {
        const orderA = a.articleSortOrder || 0
        const orderB = b.articleSortOrder || 0
        if (orderA === orderB) {
          return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
        } else {
          return orderB - orderA
        }
      } else {
        return a.nodeType === StorageNodeType.Dir ? -1 : 1
      }
    })

    for (const treeNode of treeNodes) {
      nodes.push(treeNode.item)
      sort(treeNode.children)
    }
  }

  sort(topTreeNodes)

  return nodes
}

/**
 * ディレクトリの子ノードをソートする関数です。
 */
const storageChildrenSortFunc = <NODE extends SortStorageNode>(a: NODE, b: NODE) => {
  if (a.nodeType === b.nodeType) {
    const orderA = a.articleSortOrder || 0
    const orderB = b.articleSortOrder || 0
    if (orderA === orderB) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    } else {
      return orderB - orderA
    }
  } else {
    return a.nodeType === StorageNodeType.Dir ? -1 : 1
  }
}

/**
 * ストレージノードにアクセスするための基準となるURLです。
 */
function getBaseStorageURL(): string {
  return `${removeEndSlash(config.api.baseURL)}/storage`
}

/**
 * ストレージノードのアクセス先となるURLを取得します。
 * @param nodeId
 */
function getStorageNodeURL(nodeId: string): string {
  return `${getBaseStorageURL()}/${nodeId}`
}

//========================================================================
//
//  Exports
//
//========================================================================

export { BaseLogic, SortStorageNode, sortStorageTree, storageChildrenSortFunc, getBaseStorageURL, getStorageNodeURL }
