import { ComputedRef, Ref } from '@vue/composition-api'
import {
  CreateStorageNodeOptions,
  RequiredStorageNodeShareSettings,
  SignedUploadUrlInput,
  StorageNode,
  StorageNodeGetKeyInput,
  StorageNodeGetKeysInput,
  StorageNodeKeyInput,
  StorageNodeShareSettingsInput,
} from '@/app/services/base'
import { StorageDownloader, StorageFileDownloader, StorageFileDownloaderType } from '@/app/services/modules/storage/download'
import { StorageFileUploader, StorageUploader, UploadFileParam } from '@/app/services/modules/storage/upload'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageService {
  /**
   * ストレージのベースパスです。
   * このサービスで扱うノードはこのベースパスを基準とした相対パスになります。
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
   * @param options
   */
  createDir(dirPath: string, options?: CreateStorageNodeOptions): Promise<StorageNode>
  /**
   * 指定ディレクトリとその階層を構成するディレクトリを作成します。
   * @param dirPaths 作成するディレクトリを指定します。
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
   * Cloud Storageのセキュリティルールを通過させるため、
   * ユーザークレイムにファイルアクセス権限を設定します。
   * @param key
   */
  setFileAccessAuthClaims(key: StorageNodeKeyInput): Promise<void>
  /**
   * Cloud Storageのセキュリティルールを通過させるために
   * ユーザークレイムに設定されていたファイルアクセス権限を削除します。
   */
  removeFileAccessAuthClaims(): Promise<void>
  /**
   * 署名付きのアップロードURLを取得します。
   * @param input
   */
  getSignedUploadUrl(input: SignedUploadUrlInput): Promise<string>
  /**
   * ノードパスをフルパスに変換します。
   * @param nodePath
   */
  toFullPath(nodePath?: string): string
  /**
   * ノードパスをフルパスに変換します。
   * @param nodePaths
   */
  toFullPaths(nodePaths: string[]): string[]

  newUploader(owner: Ref<Element | undefined>): StorageUploader

  newFileUploader(uploadParam: UploadFileParam): StorageFileUploader

  newDownloader(): StorageDownloader

  newUrlUploader(owner: Ref<Element | undefined>): StorageUploader

  newFileDownloader(type: StorageFileDownloaderType, filePath: string): StorageFileDownloader
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageService }
