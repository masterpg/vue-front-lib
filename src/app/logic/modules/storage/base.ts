import { ComputedRef, Ref } from '@vue/composition-api'
import {
  CreateStorageNodeInput,
  RequiredStorageNodeShareSettings,
  SignedUploadUrlInput,
  SortStorageNode,
  StorageNode,
  StorageNodeGetKeyInput,
  StorageNodeGetKeysInput,
  StorageNodeKeyInput,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  sortStorageTree,
  storageChildrenSortFunc,
} from '@/app/logic/base'
import { DeepReadonly, removeBothEndsSlash, removeEndSlash, removeStartDirChars } from 'web-base-lib'
import { StorageDownloader, StorageFileDownloader, StorageFileDownloaderType } from '@/app/logic/modules/storage/download'
import { StorageFileUploader, StorageUploader, UploadFileParam } from '@/app/logic/modules/storage/upload'
import _path from 'path'
import { useConfig } from '@/app/config'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageLogic {
  /**
   * ストレージのベースパスです。
   * このロジックで扱うノードはこのベースパスを基準とした相対パスになります。
   */
  readonly basePath: ComputedRef<string>
  /**
   * ベースパスルート配下のノードをストアから取得します。
   */
  getAllNodes(): StorageNode[]
  /**
   * 指定ノードをストアから取得します。
   * @param key
   */
  getNode(key: StorageNodeGetKeyInput): StorageNode | undefined
  /**
   * 指定されたノードリストを取得します。
   * @param input
   */
  getNodes(input: StorageNodeGetKeysInput): StorageNode[]
  /**
   * 指定ノードをストアから取得します。
   * ノードが存在しない場合は例外がスローされます。
   * @param key
   */
  sgetNode(key: StorageNodeGetKeyInput): StorageNode
  /**
   * 指定ディレクトリとその配下のノードをストアから取得します。
   * @param dirPath 対象となるディレクトリを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルート配下のノードを取得します。
   */
  getDirDescendants(dirPath?: string): StorageNode[]
  /**
   * 指定ディレクトリ配下のノードをストアから取得します。
   * @param dirPath 対象となるディレクトリを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルート配下のノードを取得します。
   *   ※引数が未指定の場合、`getDirDescendants()`と同じ挙動となります。
   */
  getDescendants(dirPath?: string): StorageNode[]
  /**
   * 指定ディレクトリとその直下のノードをストアから取得します。
   * @param dirPath 対象となるディレクトリを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルート直下のノードを取得します。
   */
  getDirChildren(dirPath?: string): StorageNode[]
  /**
   * 指定ディレクトリ直下のノードをストアから取得します。
   * @param dirPath 対象となるディレクトリを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルート直下のノードを取得します。
   *   ※引数が未指定の場合、`getDirChildren()`と同じ挙動となります。
   */
  getChildren(dirPath?: string): StorageNode[]
  /**
   * 指定ノードとその階層を構成するディレクトリをストアから取得します。
   * 戻り値で取得される階層構造のトップは、ベースパスルート直下のディレクトリとなります。
   *
   * @param nodePath 対象となるノードを指定します。
   *   ベースパスルート(空文字)の指定は許可されないので注意ください。
   */
  getHierarchicalNodes(nodePath: string): StorageNode[]
  /**
   * 指定ノードをもとに、上位ディレクトリを加味た共有設定をストアから取得します。
   * @param nodePath
   */
  getInheritedShare(nodePath: string): RequiredStorageNodeShareSettings
  /**
   * ベースパスルートとその階層を構成するディレクトリをサーバーから取得し、ストアに格納します。
   * もしベースパスルートが存在しない場合、階層を構成するディレクトリを含め、ベースパスルートを作成します。
   *
   * 補足: 内部的にはベースパスルートを超え、バケットルート直下のディレクトリまで取得/作成し、ストアに格納します。
   */
  fetchRoot(): Promise<void>
  /**
   * 指定されたノードを取得します。
   * @param input
   */
  fetchNode(input: StorageNodeGetKeyInput): Promise<StorageNode | undefined>
  /**
   * 指定されたノードを取得します。
   * @param input
   */
  fetchNodes(input: StorageNodeGetKeysInput): Promise<StorageNode[]>
  /**
   * 指定ノードとその階層を構成するディレクトリをサーバーから取得します。
   * 戻り値で取得される階層構造のトップは、ベースパスルート直下のディレクトリとなります。
   *
   * 補足: 内部的にはベースパスルートを超え、バケットルート直下のディレクトリまで取得し、ストアに格納します 。
   *
   * @param nodePath 対象となるノードを指定します。
   *   ベースパスルートの階層構造をストアに格納することを目的とする場合、引数を未指定(または空文字)にしてください。
   */
  fetchHierarchicalNodes(nodePath?: string): Promise<StorageNode[]>
  /**
   * 指定ノードの階層を構成する祖先(指定ノードは含まない)を取得し、ストアに格納します。
   * 戻り値で取得される階層構造のトップは、ベースパスルート直下のディレクトリとなります。
   *
   * 補足: 内部的にはベースパスルートを超え、バケットルート直下のディレクトリまで取得し、ストアに格納します 。
   *
   * @param nodePath 対象となるノードを指定します。
   *   ベースパスルートの祖先をストアに格納することを目的とする場合、引数を未指定(または空文字)にしてください。
   */
  fetchAncestorDirs(nodePath?: string): Promise<StorageNode[]>
  /**
   * 指定ディレクトリとその配下のノードをサーバーから取得し、ストアに格納します。
   * @param dirPath 対象となるディレクトリを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルートとその配下のノードを取得します。
   */
  fetchDirDescendants(dirPath?: string): Promise<StorageNode[]>
  /**
   * 指定ディレクトリ配下のノードをサーバーから取得し、ストアに格納します。
   * @param dirPath 対象となるディレクトリを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルートとその配下のノードを取得します。
   *   ※引数が未指定の場合、`fetchDirDescendants()`と同じ挙動となります。
   */
  fetchDescendants(dirPath?: string): Promise<StorageNode[]>
  /**
   * 指定ディレクトリとその直下のノードをサーバーから取得し、ストアに格納します。
   * @param dirPath 対象となるディレクトリを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルートとその直下のノードを取得します。
   */
  fetchDirChildren(dirPath?: string): Promise<StorageNode[]>
  /**
   * 指定ディレクトリ直下のノードをサーバーから取得し、ストアに格納します。
   * @param dirPath 対象となるディレクトリを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルートとその直下のノードを取得します。
   *   ※引数が未指定の場合、`fetchDirChildren()`と同じ挙動となります。
   */
  fetchChildren(dirPath?: string): Promise<StorageNode[]>
  /**
   * 指定ディレクトリとその階層を構成するディレクトリ、さらに指定ディレクトリ配下のノードを取得し、
   * ストアに格納します。
   * @param dirPath 対象となるディレクトリを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルートとその階層を構成するディレクトリ、
   *   さらにベースパスルート配下のノードを取得します。
   */
  fetchHierarchicalDescendants(dirPath?: string): Promise<StorageNode[]>
  /**
   * 指定ディレクトリとその階層を構成するディレクトリ、さらに指定ディレクトリ直下のノードを取得し、
   * ストアに格納します。
   * @param dirPath 対象となるディレクトリを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルートとその階層を構成するディレクトリ、
   *   さらにベースパスルート直下のノードを取得します。
   */
  fetchHierarchicalChildren(dirPath?: string): Promise<StorageNode[]>
  /**
   * 指定ディレクトリを作成します。
   * @param dirPath 作成するディレクトリを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルートを作成します。
   * @param input
   */
  createDir(dirPath?: string, input?: CreateStorageNodeInput): Promise<StorageNode>
  /**
   * 指定ディレクトリとその階層を構成するディレクトリを作成します。
   * @param dirPaths 作成するディレクトリを指定します。
   *   配列で指定されたパスが空文字の場合、ベースパスルートとその階層を構成するディレクトリを作成します。
   */
  createHierarchicalDirs(dirPaths: string[]): Promise<StorageNode[]>
  /**
   * 指定ディレクトリとその配下のノードを削除します。
   * @param dirPath
   */
  removeDir(dirPath: string): Promise<void>
  /**
   * 指定ファイルを削除します。
   * @param filePath
   */
  removeFile(filePath: string): Promise<void>
  /**
   * ディレクトリの移動を行います。
   *
   * 引数は次のように指定します。
   *   + fromDirPath: 'home/photos'
   *   + toDirPath: 'home/archives/photos'
   *
   * @param fromDirPath
   * @param toDirPath
   */
  moveDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]>
  /**
   * ファイルの移動を行います。
   *
   * 引数は次のように指定します。
   *   + fromFilePath: 'home/photos/family.png'
   *   + toFilePath: 'home/archives/family.png'
   *
   * @param fromFilePath
   * @param toFilePath
   */
  moveFile(fromFilePath: string, toFilePath: string): Promise<StorageNode>
  /**
   * ディレクトリの名前変更を行います。
   *
   * 引数が次のように指定された場合、
   *   + dirNode: 'home/photos'
   *   + newName: 'my-photos'
   *
   * 次のような名前変更が行われます。
   *   + 変更前: 'home/photos'
   *   + 変更後: 'home/my-photos'
   *
   * @param dirPath
   * @param newName
   */
  renameDir(dirPath: string, newName: string): Promise<StorageNode[]>
  /**
   * ファイルの名前変更を行います。
   *
   * 引数が次のように指定された場合、
   *   + filePath: 'photos/family.png'
   *   + newName: 'my-family.png'
   *
   * 次のような名前変更が行われます。
   *   + 変更前: 'photos/family.png'
   *   + 変更後: 'photos/my-family.png'
   *
   * @param filePath
   * @param newName
   */
  renameFile(filePath: string, newName: string): Promise<StorageNode>
  /**
   * ディレクトリに対して共有設定を行います。
   * @param dirPath
   * @param input
   */
  setDirShareSettings(dirPath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode>
  /**
   * ファイルに対して共有設定を行います。
   * @param filePath
   * @param input
   */
  setFileShareSettings(filePath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode>
  /**
   * ファイルアップロードの後に必要な処理を行います。
   * @param input
   */
  handleUploadedFile(input: StorageNodeKeyInput): Promise<StorageNode>
  /**
   * 署名付きのアップロードURLを取得します。
   * @param input
   */
  getSignedUploadUrl(input: SignedUploadUrlInput): Promise<string>

  newUploader(owner: Ref<Element | undefined>): StorageUploader

  newFileUploader(uploadParam: UploadFileParam): StorageFileUploader

  newDownloader(): StorageDownloader

  newUrlUploader(owner: Ref<Element | undefined>): StorageUploader

  newFileDownloader(type: StorageFileDownloaderType, filePath: string): StorageFileDownloader
}

type StorageType = 'user' | 'app' | 'article'

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageLogic {
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
        if (node.path.startsWith(`${basePath}/`)) {
          result.push(to(basePath, node))
        }
      }
      return result as T
    } else {
      const node = node_or_nodes as DeepReadonly<StorageNode>
      return to(basePath, node) as T
    }
  }

  /**
   * 指定されたノードをベースパスを基準に変換したパスに変換して返します。
   * @param basePath
   * @param node_or_nodes
   */
  export function toBasePathNode<T extends StorageNode | StorageNode[] | DeepReadonly<StorageNode> | DeepReadonly<StorageNode>[] | undefined>(
    basePath: string,
    node_or_nodes: T
  ): T {
    if (!basePath) return node_or_nodes as T
    if (!node_or_nodes) return node_or_nodes as T

    function to<U extends StorageNode | DeepReadonly<StorageNode>>(basePath: string, node: U): U {
      return {
        ...node,
        dir: toBasePath(basePath, node.dir),
        path: toBasePath(basePath, node.path),
      }
    }

    if (Array.isArray(node_or_nodes)) {
      const nodes = node_or_nodes as DeepReadonly<StorageNode>[]
      const result: DeepReadonly<StorageNode>[] = []
      for (const node of nodes) {
        if (node.path.startsWith(`${basePath}/`)) {
          result.push(to(basePath, node))
        }
      }
      return result as T
    } else {
      const node = node_or_nodes as DeepReadonly<StorageNode>
      return to(basePath, node) as T
    }
  }

  /**
   * ノードパスをフルパスに変換します。
   * @param basePath
   * @param nodePath_or_nodePaths
   */
  export function toFullPath<T extends string | string[]>(basePath: string, nodePath_or_nodePaths?: T): T {
    function to(basePath: string, nodePath?: string): string {
      basePath = removeBothEndsSlash(basePath)
      nodePath = removeBothEndsSlash(nodePath)
      return removeStartDirChars(_path.join(basePath, nodePath))
    }

    if (Array.isArray(nodePath_or_nodePaths)) {
      const nodePaths = nodePath_or_nodePaths as string[]
      const result = nodePaths.map(nodePath => to(basePath, nodePath))
      return result as T
    } else {
      const nodePath = nodePath_or_nodePaths as string | undefined
      const result = to(basePath, nodePath)
      return result as T
    }
  }

  /**
   * ノードパスをベースパスを基準とした相対パスへ変換します。
   * @param basePath
   * @param nodePath_or_nodePaths
   */
  export function toBasePath<T extends string | string[]>(basePath: string, nodePath_or_nodePaths?: T): T {
    function to(basePath: string, nodePath?: string): string {
      basePath = removeBothEndsSlash(basePath)
      nodePath = removeBothEndsSlash(nodePath)
      const basePathReg = new RegExp(`^${basePath}`)
      return removeStartDirChars(nodePath.replace(basePathReg, ''))
    }

    if (Array.isArray(nodePath_or_nodePaths)) {
      const nodePaths = nodePath_or_nodePaths as string[]
      const result = nodePaths.map(nodePath => to(basePath, nodePath))
      return result as T
    } else {
      const nodePath = nodePath_or_nodePaths as string | undefined
      const result = to(basePath, nodePath)
      return result as T
    }
  }

  /**
   * ノード配列をディレクトリ階層に従ってソートします。
   * @param nodes
   */
  export function sortTree<NODE extends SortStorageNode>(nodes: NODE[]): NODE[] {
    return sortStorageTree(nodes)
  }

  /**
   * ディレクトリの子ノードをソートをソートします。
   * @param nodes
   */
  export function sortChildren<NODE extends SortStorageNode>(nodes: NODE[]): NODE[] {
    return nodes.sort(childrenSortFunc)
  }

  /**
   * ディレクトリの子ノードをソートする関数です。
   */
  export const childrenSortFunc = storageChildrenSortFunc

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

export { StorageLogic, StorageType }
