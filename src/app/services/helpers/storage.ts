import { DeepReadonly, removeBothEndsSlash, removeEndSlash, removeStartDirChars } from 'web-base-lib'
import { SortStorageNode, StorageNode, StorageNodeShareSettings, StorageType, TreeStorageNode } from '@/app/services'
import _path from 'path'
import { useConfig } from '@/app/config'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageHelper {}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageHelper {
  /**
   * ストレージノードにアクセスするための基準となるURLです。
   */
  export function getBaseURL(): string {
    const config = useConfig()
    return `${removeEndSlash(config.api.baseURL)}/storage`
  }

  /**
   * ストレージノードのアクセス先となるURLを取得します。
   * @param nodeId
   */
  export function getNodeURL(nodeId: string): string {
    return `${getBaseURL()}/${nodeId}`
  }

  /**
   * ノードのパスをフルパスに変換します。
   * @param basePath
   * @param node_or_nodes
   */
  export function toFullPathNode<T extends StorageNode | StorageNode[] | DeepReadonly<StorageNode> | DeepReadonly<StorageNode>[] | undefined>(
    basePath: string,
    node_or_nodes: T
  ): T {
    if (!basePath) return node_or_nodes as T
    if (!node_or_nodes) return node_or_nodes as T

    function to<U extends StorageNode | DeepReadonly<StorageNode>>(basePath: string, node: U): U {
      return {
        ...node,
        dir: toFullPath(basePath, node.dir),
        path: toFullPath(basePath, node.path),
      }
    }

    if (Array.isArray(node_or_nodes)) {
      const nodes = node_or_nodes as DeepReadonly<StorageNode>[]
      const result: DeepReadonly<StorageNode>[] = []
      for (const node of nodes) {
        result.push(to(basePath, node))
      }
      return result as T
    } else {
      const node = node_or_nodes as DeepReadonly<StorageNode>
      return to(basePath, node) as T
    }
  }

  /**
   * 指定されたノードをベースパスを基準に変換したパスに変換して返します。
   * ベースパスと指定ノードのパスが同じまたは配下ノードでない場合、`undefined`を返します。
   * @param basePath
   * @param node
   */
  export function toBasePathNode<T extends StorageNode | DeepReadonly<StorageNode>>(basePath: string, node?: T): T | undefined {
    basePath = removeBothEndsSlash(basePath)
    if (!basePath) return node
    if (!node) return node

    // 指定ノードがベースパス配下でない場合
    if (!node.path.startsWith(`${basePath}/`)) {
      return undefined
    }

    return {
      ...node,
      dir: toBasePath(basePath, node.dir),
      path: toBasePath(basePath, node.path),
    }
  }

  /**
   * 指定されたノードをベースパスを基準に変換したパスに変換して返します。
   * ベースパスと指定ノードのパスが同じまたは配下ノードでない場合、そのノードは除外されます。
   * @param basePath
   * @param nodes
   */
  export function toBasePathNodes<T extends StorageNode | DeepReadonly<StorageNode>>(basePath: string, nodes: T[]): T[] {
    return nodes.reduce<T[]>((result, node) => {
      const node_ = toBasePathNode(basePath, node)
      node_ && result.push(node_)
      return result
    }, [])
  }

  /**
   * ノードパスをフルパスに変換します。
   * @param basePath
   * @param nodePath
   */
  export function toFullPath(basePath: string, nodePath?: string): string {
    basePath = removeBothEndsSlash(basePath)
    nodePath = removeBothEndsSlash(nodePath)
    return removeStartDirChars(_path.join(basePath, nodePath))
  }

  /**
   * ノードパスをフルパスに変換します。
   * @param basePath
   * @param nodePaths
   */
  export function toFullPaths(basePath: string, nodePaths: string[]): string[] {
    return nodePaths.map(nodePath => toFullPath(basePath, nodePath))
  }

  /**
   * ノードパスをベースパスを基準とした相対パスへ変換します。
   * @param basePath
   * @param nodePath
   */
  export function toBasePath(basePath: string, nodePath?: string): string {
    basePath = removeBothEndsSlash(basePath)
    nodePath = removeBothEndsSlash(nodePath)
    const basePathReg = new RegExp(`^${basePath}`)
    return removeStartDirChars(nodePath.replace(basePathReg, ''))
  }

  /**
   * ノードパスをベースパスを基準とした相対パスへ変換します。
   * @param basePath
   * @param nodePaths
   */
  export function toBasePaths(basePath: string, nodePaths: string[]): string[] {
    return nodePaths.map(nodePath => toBasePath(basePath, nodePath))
  }

  /**
   * 指定されたユーザーのルートディレクトリを取得します。
   * @param uid
   */
  export function toUserRootPath(uid: string): string {
    const config = useConfig()
    return _path.join(config.storage.user.rootName, uid)
  }

  /**
   * ユーザーの記事ルートのパスを取得します。
   * @param uid
   */
  export function toArticleRootPath(uid: string): string {
    const config = useConfig()
    return _path.join(toUserRootPath(uid), config.storage.article.rootName)
  }

  /**
   * 記事用のアッセトディレクトリのパスを取得します。
   * @param uid
   */
  export function toArticleAssetsPath(uid: string): string {
    const config = useConfig()
    return _path.join(toArticleRootPath(uid), config.storage.article.assetsName)
  }

  /**
   * 記事ソースのマスターファイルパスを取得します。
   * @param articleDirPath 記事ディレクトリパス
   */
  export function toArticleSrcMasterPath(articleDirPath: string): string {
    const config = useConfig()
    articleDirPath = removeStartDirChars(articleDirPath)
    return _path.join(articleDirPath, config.storage.article.srcMasterFileName)
  }

  /**
   * 記事ソースの下書きファイルパスを取得します。
   * @param articleDirPath 記事ディレクトリパス
   */
  export function toArticleSrcDraftPath(articleDirPath: string): string {
    const config = useConfig()
    articleDirPath = removeStartDirChars(articleDirPath)
    return _path.join(articleDirPath, config.storage.article.srcDraftFileName)
  }

  /**
   * 指定されたパスが記事ルートを含めたファミリーノードか否かを取得します。
   * @param nodePath
   */
  export function isArticleRootFamily(nodePath: string): boolean {
    const config = useConfig()
    const userRootName = config.storage.user.rootName
    const articleRootName = config.storage.article.rootName
    const reg = new RegExp(`^${userRootName}/[^/]+/(?:${articleRootName}$|${articleRootName}/)`)
    return reg.test(nodePath)
  }

  /**
   * 指定されたパスが記事ルートの配下ノードか否かを取得します。
   * @param nodePath
   */
  export function isArticleRootUnder(nodePath: string): boolean {
    const config = useConfig()
    const userRootName = config.storage.user.rootName
    const articleRootName = config.storage.article.rootName
    const reg = new RegExp(`^${userRootName}/[^/]+/${articleRootName}/`)
    return reg.test(nodePath)
  }

  /**
   * 指定されたパスがアセットディレクトリを含めたファミリーノードか否かを取得します。
   * @param nodePath
   */
  export function isArticleAssetsDir(nodePath: string): boolean {
    const config = useConfig()
    const userRootName = config.storage.user.rootName
    const articleRootName = config.storage.article.rootName
    const assetsName = config.storage.article.assetsName
    const reg = new RegExp(`^${userRootName}/[^/]+/${articleRootName}/${assetsName}$`)
    return reg.test(nodePath)
  }

  /**
   * 指定されたパスがアセットディレクトリを含めたファミリーノードか否かを取得します。
   * @param nodePath
   */
  export function isArticleAssetFamily(nodePath: string): boolean {
    const config = useConfig()
    const userRootName = config.storage.user.rootName
    const articleRootName = config.storage.article.rootName
    const assetsName = config.storage.article.assetsName
    const reg = new RegExp(`^${userRootName}/[^/]+/${articleRootName}/(?:${assetsName}$|${assetsName}/)`)
    return reg.test(nodePath)
  }

  /**
   * ノード配列をディレクトリ階層に従ってソートします。
   * @param nodes
   */
  export function sortNodes<NODE extends SortStorageNode>(nodes: NODE[]): NODE[] {
    const sortChildren = (children: TreeStorageNode<NODE>[]) => {
      children.sort((treeNodeA, treeNodeB) => {
        const a = treeNodeA.item
        const b = treeNodeB.item
        return childrenSortFunc(a, b)
      })
    }

    const sort = (treeNodes: TreeStorageNode<NODE>[]) => {
      for (const treeNode of treeNodes) {
        nodes.push(treeNode.item)
        isArticleRootFamily(treeNode.item.path) && sortChildren(treeNode.children)
        sort(treeNode.children)
      }
    }

    // 一旦通常のディレクトリ階層用のソートを行う
    nodes.sort(treeSortFunc)

    // ノード配列をツリー構造に変換し、トップレベルのノードのみ配列に抽出する
    // ※トップレベルノード = 親が存在しないノード
    const topTreeNodes: TreeStorageNode<NODE>[] = []
    const treeNodeDict: { [path: string]: TreeStorageNode<NODE> } = {}
    for (const node of nodes) {
      const parent = treeNodeDict[node.dir]
      const treeNode: TreeStorageNode<NODE> = { item: node, parent, children: [] }
      treeNodeDict[node.path] = treeNode
      if (parent) {
        parent.children.push(treeNode)
      } else {
        topTreeNodes.push(treeNode)
      }
    }

    // 引数ノード配列を一旦クリアする
    // ※この後のソートで並べ替えられたノードがこの配列に設定される
    nodes.splice(0)

    // トップレベルノードが記事ルート配下のものである場合、記事系ソートを行う
    if (topTreeNodes.length && isArticleRootUnder(topTreeNodes[0].item.path)) {
      sortChildren(topTreeNodes)
    }

    // トップレベルノードの配下にあるノードのソートを行う
    sort(topTreeNodes)

    return nodes
  }

  /**
   * ディレクトリの子ノードをソートをソートします。
   * @param nodes
   */
  export function sortChildren<NODE extends SortStorageNode>(nodes: NODE[]): NODE[] {
    return nodes.sort(childrenSortFunc)
  }

  /**
   * ノード配列をディレクトリ階層に従ってソートする関数です。
   * ※この関数では記事系ノードを適切にソートすることはできません。
   */
  export function treeSortFunc<NODE extends SortStorageNode>(a: NODE, b: NODE): number {
    // ソート用文字列(strA, strB)の説明:
    //   ノードがファイルの場合、同じ階層にあるディレクトリより順位を下げるために
    //   大きな文字コード'0xffff'を付加している。これにより同一階層のファイルと
    //   ディレクトリを比較した際、ファイルの方が文字的に大きいと判断され、下の方へ
    //   配置されることになる。

    let strA = a.path
    let strB = b.path
    if (a.nodeType === 'File') {
      strA = `${a.dir}${String.fromCodePoint(0xffff)}${a.name}`
    }
    if (b.nodeType === 'File') {
      strB = `${b.dir}${String.fromCodePoint(0xffff)}${b.name}`
    }

    return strA < strB ? -1 : strA > strB ? 1 : 0
  }

  /**
   * ディレクトリの子ノードをソートする関数です。
   */
  export function childrenSortFunc<NODE extends SortStorageNode>(a: NODE, b: NODE): number {
    if (a.article?.file?.type === 'Master') return -1
    if (b.article?.file?.type === 'Master') return 1
    if (a.article?.file?.type === 'Draft') return -1
    if (b.article?.file?.type === 'Draft') return 1

    if (a.nodeType === b.nodeType) {
      const orderA = a.article?.dir?.sortOrder ?? 0
      const orderB = b.article?.dir?.sortOrder ?? 0
      if (orderA === orderB) {
        const nameA = a.article?.dir?.name || a.name
        const nameB = b.article?.dir?.name || b.name
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0
      } else {
        return orderB - orderA
      }
    } else {
      return a.nodeType === 'Dir' ? -1 : 1
    }
  }

  /**
   * 指定されたノードパスからユーザー名を取り出します。
   * @param nodePath
   */
  export function extractUId(nodePath: string): string {
    const config = useConfig()
    const reg = new RegExp(`^${config.storage.user.rootName}/(?<uid>[^/]+)`)
    const execArray = reg.exec(nodePath)
    return execArray?.groups?.uid ?? ''
  }

  /**
   * 指定されたパスのストレージタイプを取得します。
   * @param nodePath
   */
  export function getStorageType(nodePath: string): StorageType {
    const config = useConfig()
    const userRootName = config.storage.user.rootName
    const articleRootName = config.storage.article.rootName

    // 引数パスが記事ルート含め配下を示す場合
    const articlesReg = new RegExp(`^${userRootName}/[^/]+/(?:${articleRootName}$|${articleRootName}/)`)
    if (articlesReg.test(nodePath)) {
      return 'article'
    }

    // 引数パスがユーザールート含め配下を示す場合
    const usersReg = new RegExp(`^${userRootName}/[^/]+/(?:[^/]+$|[^/]+/)`)
    if (usersReg.test(nodePath)) {
      return 'user'
    }

    // 上記以外はアプリケーションストレージ
    return 'app'
  }

  export function isRootNode(nodePath?: string): boolean {
    // アプリケーションルートの場合
    if (!nodePath) {
      return true
    }

    const config = useConfig()
    const userRootName = config.storage.user.rootName
    const articleRootName = config.storage.article.rootName

    // 記事ルートかチェック
    const articlesReg = new RegExp(`^${userRootName}/[^/]+/${articleRootName}/?$`)
    if (articlesReg.test(nodePath)) {
      return true
    }

    // ユーザールートかチェック
    const usersReg = new RegExp(`^${userRootName}/[^/]+/?$`)
    if (usersReg.test(nodePath)) {
      return true
    }

    return false
  }

  export function EmptyShareSettings(): StorageNodeShareSettings {
    return {
      isPublic: null,
      readUIds: null,
      writeUIds: null,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageHelper }
