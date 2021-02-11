import { DeepPartial, DeepReadonly, Entities, pickProps, removeBothEndsSlash, removeEndSlash, removeStartDirChars } from 'web-base-lib'
import { TimestampEntity, generateEntityId } from '@/app/service/base/base'
import _path from 'path'
import dayjs from 'dayjs'
import { useConfig } from '@/app/config'
import { useI18n } from '@/app/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageNode extends TimestampEntity {
  nodeType: StorageNodeType
  name: string
  dir: string
  path: string
  url: string
  contentType: string
  size: number
  share: StorageNodeShareSettings
  article?: StorageArticleSettings
  version: number
}

interface APIStorageNode extends Omit<StorageNode, 'url'> {}

enum StorageNodeType {
  File = 'File',
  Dir = 'Dir',
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
namespace StorageNodeType {
  export function getLabel(nodeType: StorageNodeType, choice = 1): string {
    const i18n = useI18n()
    switch (nodeType) {
      case StorageNodeType.Dir:
        return String(i18n.tc('common.folder', choice))
      case StorageNodeType.File:
        return String(i18n.tc('common.file', choice))
    }
  }

  export function getIcon(nodeType: StorageNodeType): string {
    switch (nodeType) {
      case StorageNodeType.Dir:
        return 'folder'
      case StorageNodeType.File:
        return 'far fa-file'
    }
  }
}

enum StorageArticleDirType {
  ListBundle = 'ListBundle',
  TreeBundle = 'TreeBundle',
  Category = 'Category',
  Article = 'Article',
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
namespace StorageArticleDirType {
  export function getLabel(nodeType?: StorageArticleDirType, choice = 1): string {
    const i18n = useI18n()
    switch (nodeType) {
      case StorageArticleDirType.ListBundle:
        return String(i18n.tc('article.nodeType.listBundle', choice))
      case StorageArticleDirType.TreeBundle:
        return String(i18n.tc('article.nodeType.treeBundle', choice))
      case StorageArticleDirType.Category:
        return String(i18n.tc('article.nodeType.category', choice))
      case StorageArticleDirType.Article:
        return String(i18n.tc('article.nodeType.article', choice))
      default:
        return ''
    }
  }

  export function getIcon(nodeType?: StorageArticleDirType): string {
    switch (nodeType) {
      case StorageArticleDirType.ListBundle:
        return 'fas fa-bars'
      case StorageArticleDirType.TreeBundle:
        return 'fas fa-stream'
      case StorageArticleDirType.Category:
        return 'fas fa-list-alt'
      case StorageArticleDirType.Article:
        return 'fas fa-file-alt'
      default:
        return ''
    }
  }
}

enum StorageArticleFileType {
  Master = 'Master',
  Draft = 'Draft',
}

interface StorageNodeShareSettings {
  isPublic: boolean | null
  readUIds: string[] | null
  writeUIds: string[] | null
}

interface StorageArticleSettings {
  dir?: StorageArticleDirSettings
  file?: StorageArticleFileSettings
}

interface StorageArticleDirSettings {
  name: string
  type: StorageArticleDirType
  sortOrder: number
}

interface StorageArticleFileSettings {
  type: StorageArticleFileType
}

interface StoragePaginationInput {
  maxChunk?: number
  pageToken?: string
}

namespace StoragePaginationInput {
  export function squeeze<T extends StoragePaginationInput | undefined>(input?: StoragePaginationInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['maxChunk', 'pageToken']) as T
  }
}

interface StoragePaginationResult<NODE extends DeepReadonly<APIStorageNode> = APIStorageNode> {
  list: NODE[]
  nextPageToken?: string
  isPaginationTimeout: boolean
}

interface RequiredStorageNodeShareSettings {
  isPublic: boolean
  readUIds: string[]
  writeUIds: string[]
}

interface StorageNodeShareSettingsInput {
  isPublic?: boolean | null
  readUIds?: string[] | null
  writeUIds?: string[] | null
}

namespace StorageNodeShareSettingsInput {
  export function squeeze<T extends StorageNodeShareSettingsInput | undefined>(input?: StorageNodeShareSettingsInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['isPublic', 'readUIds', 'writeUIds']) as T
  }
}

interface StorageNodeKeyInput {
  id: string
  path: string
}

namespace StorageNodeKeyInput {
  export function squeeze<T extends StorageNodeKeyInput | undefined>(input?: StorageNodeKeyInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['id', 'path']) as T
  }
}

interface StorageNodeGetKeyInput {
  id?: string
  path?: string
}

namespace StorageNodeGetKeyInput {
  export function squeeze<T extends StorageNodeGetKeyInput | undefined>(input?: StorageNodeGetKeyInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['id', 'path']) as T
  }
}

interface StorageNodeGetKeysInput {
  ids?: string[]
  paths?: string[]
}

namespace StorageNodeGetKeysInput {
  export function squeeze<T extends StorageNodeGetKeysInput | undefined>(input?: StorageNodeGetKeysInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['ids', 'paths']) as T
  }
}

interface SignedUploadUrlInput {
  id: string
  path: string
  contentType?: string
}

namespace SignedUploadUrlInput {
  export function squeeze<T extends SignedUploadUrlInput | undefined>(input?: SignedUploadUrlInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['id', 'path', 'contentType']) as T
  }
}

interface CreateStorageNodeOptions {
  share?: StorageNodeShareSettingsInput
}

namespace CreateStorageNodeOptions {
  export function squeeze<T extends CreateStorageNodeOptions | undefined>(options?: CreateStorageNodeOptions): T {
    if (!options) return undefined as T
    return {
      share: StorageNodeShareSettingsInput.squeeze(options.share),
    } as T
  }
}

interface CreateArticleTypeDirInput {
  dir: string
  name: string
  type: StorageArticleDirType
}

namespace CreateArticleTypeDirInput {
  export function squeeze<T extends CreateArticleTypeDirInput | undefined>(input?: CreateArticleTypeDirInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['dir', 'name', 'type']) as T
  }
}

interface SaveArticleSrcMasterFileResult {
  master: StorageNode
  draft: StorageNode
}

interface GetArticleChildrenInput {
  dirPath: string
  types: StorageArticleDirType[]
}

namespace GetArticleChildrenInput {
  export function squeeze<T extends GetArticleChildrenInput | undefined>(input?: GetArticleChildrenInput): T {
    if (!input) return undefined as T
    return pickProps(input, ['dirPath', 'types']) as T
  }
}

type StorageType = 'user' | 'app' | 'article'

interface SortStorageNode extends Pick<StorageNode, 'nodeType' | 'name' | 'dir' | 'path' | 'article'> {}

interface TreeStorageNode<NODE extends SortStorageNode> {
  item: NODE
  parent?: TreeStorageNode<NODE>
  children: TreeStorageNode<NODE>[]
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageUtil {
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
    if (a.nodeType === StorageNodeType.File) {
      strA = `${a.dir}${String.fromCodePoint(0xffff)}${a.name}`
    }
    if (b.nodeType === StorageNodeType.File) {
      strB = `${b.dir}${String.fromCodePoint(0xffff)}${b.name}`
    }

    return strA < strB ? -1 : strA > strB ? 1 : 0
  }

  /**
   * ディレクトリの子ノードをソートする関数です。
   */
  export function childrenSortFunc<NODE extends SortStorageNode>(a: NODE, b: NODE): number {
    if (a.article?.file?.type === StorageArticleFileType.Master) return -1
    if (b.article?.file?.type === StorageArticleFileType.Master) return 1
    if (a.article?.file?.type === StorageArticleFileType.Draft) return -1
    if (b.article?.file?.type === StorageArticleFileType.Draft) return 1

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
      return a.nodeType === StorageNodeType.Dir ? -1 : 1
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

namespace StorageNode {
  export function generateId(): string {
    return generateEntityId(Entities.StorageNodes.Name)
  }

  export function populate(from: DeepPartial<DeepReadonly<StorageNode>>, to: DeepPartial<StorageNode>): StorageNode {
    if (typeof from.id === 'string') to.id = from.id
    if (typeof from.nodeType === 'string') to.nodeType = from.nodeType
    if (typeof from.name === 'string') to.name = from.name
    if (typeof from.dir === 'string') to.dir = from.dir
    if (typeof from.path === 'string') to.path = from.path
    if (typeof from.url === 'string') to.url = from.url
    if (typeof from.contentType === 'string') to.contentType = from.contentType
    if (typeof from.size === 'number') to.size = from.size
    if (from.share) {
      to.share = to.share ?? { isPublic: null, readUIds: null, writeUIds: null }
      if (typeof from.share.isPublic === 'boolean' || from.share.isPublic === null) {
        to.share.isPublic = from.share.isPublic
      }
      if (Array.isArray(from.share.readUIds) || from.share.readUIds === null) {
        to.share!.readUIds = from.share.readUIds
      }
      if (Array.isArray(from.share.writeUIds) || from.share.writeUIds === null) {
        to.share!.writeUIds = from.share.writeUIds
      }
    }
    if (from.article) {
      to.article = StorageArticleSettings.populate(from.article, to.article ?? {})
    } else if (from.article === null) {
      to.article = undefined
    }
    if (typeof from.version === 'number') to.version = from.version
    if (dayjs.isDayjs(from.createdAt)) to.createdAt = from.createdAt
    if (dayjs.isDayjs(from.updatedAt)) to.updatedAt = from.updatedAt
    return to as StorageNode
  }

  export function clone<T extends StorageNode | StorageNode[] | undefined | null>(source?: DeepReadonly<T>): T {
    if (!source) return source as T
    if (Array.isArray(source)) {
      const list = source as DeepReadonly<StorageNode>[]
      return list.map(item => clone(item)) as T
    } else {
      const item = source as DeepReadonly<StorageNode>
      return populate(item, {}) as T
    }
  }
}

namespace StorageArticleSettings {
  export function populate(from: DeepPartial<DeepReadonly<StorageArticleSettings>>, to: DeepPartial<StorageArticleSettings>): StorageArticleSettings {
    if (from.dir) {
      to.file = undefined
      to.dir = to.dir ?? { name: null as any, type: null as any, sortOrder: null as any }
      if (typeof from.dir.name === 'string') to.dir.name = from.dir.name
      if (typeof from.dir.type === 'string') to.dir.type = from.dir.type
      if (typeof from.dir.sortOrder === 'number') to.dir!.sortOrder = from.dir.sortOrder
      if (to.dir.name === null || to.dir.type === null || to.dir.sortOrder === null) {
        const detail = JSON.stringify(to, null, 2)
        throw new Error(`The required field for 'StorageArticleSettings' has not been set: ${detail}`)
      }
    } else if (from.file) {
      to.dir = undefined
      to.file = to.file ?? { type: null as any }
      if (typeof from.file.type === 'string') to.file.type = from.file.type
      if (to.file.type === null) {
        const detail = JSON.stringify(to, null, 2)
        throw new Error(`The required field for 'StorageArticleSettings' has not been set: ${detail}`)
      }
    }
    return to as StorageArticleSettings
  }

  export function clone<T extends StorageArticleSettings | undefined | null>(source?: T): T {
    if (!source) return source as T
    return populate(source!, {}) as T
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  APIStorageNode,
  CreateArticleTypeDirInput,
  CreateStorageNodeOptions,
  GetArticleChildrenInput,
  RequiredStorageNodeShareSettings,
  SaveArticleSrcMasterFileResult,
  SignedUploadUrlInput,
  SortStorageNode,
  StorageArticleDirSettings,
  StorageArticleDirType,
  StorageArticleFileSettings,
  StorageArticleFileType,
  StorageArticleSettings,
  StorageNode,
  StorageNodeGetKeyInput,
  StorageNodeGetKeysInput,
  StorageNodeKeyInput,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  StorageNodeType,
  StoragePaginationInput,
  StoragePaginationResult,
  StorageType,
  StorageUtil,
  TreeStorageNode,
}
