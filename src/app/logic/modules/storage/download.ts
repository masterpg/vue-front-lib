import * as path from 'path'
import { StorageNode, StorageNodeType } from '@/app/logic/types'
import axios, { AxiosResponse, Canceler } from 'axios'
import { StorageLogic } from '@/app/logic/modules/storage/logic'
import { removeBothEndsSlash } from 'web-base-lib'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ResponseTypeDict {
  blob: Blob
  arraybuffer: ArrayBuffer
  text: string
}

type StorageFileDownloaderType = 'firebase' | 'http'

//========================================================================
//
//  Implementation
//
//========================================================================

/**
 * ファイルまたはディレクトリのダウンロード管理を行うダウンローダーです。
 */
class StorageDownloader {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor(protected storageLogic: StorageLogic) {}

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_downloaders: StorageFileDownloader[] = []

  /**
   * ファイルダウンローダーのリストです。
   */
  get downloaders(): StorageFileDownloader[] {
    return this.m_downloaders
  }

  /**
   * ダウンロードするファイルの総数です
   */
  get downloadNum(): number {
    return this.downloaders.length
  }

  /**
   * ダウンロードされたファイル数です。
   */
  get downloadedNum(): number {
    return this.downloaders.reduce((result, file) => {
      result += file.completed ? 1 : 0
      return result
    }, 0)
  }

  /**
   * ダウンロード対象となる全ファイルのバイト数です。
   */
  get totalSize(): number {
    return this.downloaders.reduce((result, file) => {
      result += file.size
      return result
    }, 0)
  }

  /**
   * ダウンロード対象となる全ファイルでダウンロードされたバイト数です。
   */
  get downloadedSize(): number {
    return this.downloaders.reduce((result, file) => {
      result += file.downloadedSize
      return result
    }, 0)
  }

  /**
   * ダウンロードの進捗率です。
   */
  get progress(): number {
    if (this.downloadedSize === 0) return 0
    return this.downloadedSize / this.totalSize
  }

  /**
   * ダウンロード中を表すフラグです。
   */
  get running(): boolean {
    return this.m_status === 'running'
  }

  /**
   * ダウンロード終了を示すフラグです。
   */
  get ends(): boolean {
    return this.m_status === 'ends'
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_status: 'none' | 'running' | 'ends' = 'none';

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ダウンロードを実行します。
   * 指定されたノードパスがディレクトリの場合、ディレクトリ直下のファイル（ディレクトリは除く）
   * をダウンロードします。指定されたノードパスがファイルの場合はそのファイルのみをダウンロードします。
   * @param type
   * @param nodePath
   */
  *download(type: StorageFileDownloaderType, nodePath: string) {
    nodePath = removeBothEndsSlash(nodePath)
    this.clear()
    this.m_status = 'running'

    const node = this.storageLogic.getNode({ path: nodePath })
    if (!node) {
      throw new Error(`The specified node '${path.join(this.storageLogic.basePath, nodePath)}' does not exist.`)
    }

    switch (node.nodeType) {
      case StorageNodeType.Dir: {
        const downloaders = this.storageLogic.getChildren(nodePath).reduce((result, node) => {
          if (node.nodeType === StorageNodeType.Dir) return result
          result.push(this.m_newFileDownloader(type, node.path))
          return result
        }, [] as StorageFileDownloader[])
        this.m_downloaders.push(...downloaders)
        break
      }
      case StorageNodeType.File: {
        this.m_downloaders.push(this.m_newFileDownloader(type, node.path))
        break
      }
    }

    for (const downloader of this.downloaders) {
      yield downloader
    }

    this.m_status = 'ends'
  }

  /**
   * 状態をクリアします。
   */
  clear(): void {
    this.m_downloaders.splice(0)
    this.m_status = 'none'
  }

  /**
   * ダウンロードをキャンセルします。
   */
  cancel(): void {
    for (const downloader of this.downloaders) {
      downloader.cancel()
    }
    this.m_status = 'ends'
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_newFileDownloader(type: StorageFileDownloaderType, filePath: string): StorageFileDownloader {
    return StorageFileDownloader.newInstance(this.storageLogic, type, filePath)
  }
}

/**
 * 単一ファイルダウンロードの管理を行うダウンローダーです。
 */
abstract class StorageFileDownloader {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  static newInstance(storageLogic: StorageLogic, type: StorageFileDownloaderType, filePath: string): StorageFileDownloader {
    switch (type) {
      case 'firebase':
        return new StorageFileFirebaseDownloader(storageLogic, filePath)
      case 'http':
        return new StorageFileHTTPDownloader(storageLogic, filePath)
    }
  }

  protected constructor(protected storageLogic: StorageLogic, filePath: string) {
    const fileNode = this.storageLogic.getNode({ path: filePath })
    if (!fileNode) {
      throw new Error(`The specified node '${filePath}' does not exist.`)
    }
    this.fileNode = fileNode
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_completed = false

  /**
   * ダウンロードが完了（成功）したかを示すフラグです。
   */
  get completed(): boolean {
    return this.m_completed
  }

  protected setCompleted(value: boolean): void {
    this.m_completed = value
    this.status = 'ends'
  }

  private m_failed = false

  /**
   * ダウンロードが失敗したかを示すフラグです。
   */
  get failed(): boolean {
    return this.m_failed
  }

  protected setFailed(value: boolean): void {
    this.m_failed = value
    this.status = 'ends'
  }

  private m_canceled = false

  /**
   * ダウンロードがキャンセルされたかを示すフラグです。
   */
  get canceled(): boolean {
    return this.m_canceled
  }

  protected setCanceled(value: boolean): void {
    this.m_canceled = value
    this.status = 'ends'
  }

  /**
   * ダウンロード中を示すフラグです。
   */
  get running(): boolean {
    return this.status === 'running'
  }

  /**
   * ダウンロード終了を示すフラグです。
   */
  get ends(): boolean {
    return this.status === 'ends'
  }

  private m_downloadedSize = 0

  /**
   * ダウンロードされたバイト数です。
   */
  get downloadedSize(): number {
    return this.m_downloadedSize
  }

  protected setDownloadedSize(value: number): void {
    this.m_downloadedSize = value
  }

  private m_progress = 0

  /**
   * ダウンロードの進捗率です。
   */
  get progress(): number {
    return this.m_progress
  }

  protected setProgress(value: number): void {
    this.m_progress = value
  }

  /**
   * ダウンロードファイルのファイル名です。
   */
  get name(): string {
    return this.fileNode.name
  }

  /**
   * ダウンロードファイルの格納されているディレクトリです。
   */
  get dir(): string {
    return this.fileNode.dir
  }

  /**
   * ダウンロードファイルのパスです。
   */
  get path(): string {
    return this.fileNode.path
  }

  /**
   * ダウンロードファイルのファイルサイズ（バイト）です。
   */
  get size(): number {
    return this.fileNode.size
  }

  /**
   * ダウンロードファイルのコンテンツタイプです。
   */
  get contentType(): string {
    return this.fileNode.contentType
  }

  private m_data: any | null = null

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected status: 'none' | 'running' | 'ends' = 'none'

  protected fileNode: StorageNode

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ダウンロードを実行します。
   */
  abstract async execute<T extends keyof ResponseTypeDict>(responseType: T): Promise<ResponseTypeDict[T] | undefined>

  abstract cancel(): void

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * リクエスト用の認証ヘッダを取得します。
   */
  protected async getAuthHeader(): Promise<{ Authorization?: string }> {
    const currentUser = firebase.auth().currentUser
    if (!currentUser) return {}

    const idToken = await currentUser.getIdToken()
    if (!idToken) return {}

    return {
      Authorization: `Bearer ${idToken}`,
    }
  }
}

class StorageFileFirebaseDownloader extends StorageFileDownloader {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_canceler: Canceler | null = null

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ダウンロードを実行します。
   */
  async execute<T extends keyof ResponseTypeDict>(responseType: T): Promise<ResponseTypeDict[T] | undefined> {
    if (this.canceled) return undefined

    this.status = 'running'

    // URLの取得
    const downloadFilePath = removeBothEndsSlash(path.join(this.storageLogic.basePath, this.fileNode.path))
    const fileRef = firebase.storage().ref(downloadFilePath)
    const downloadURL = await fileRef.getDownloadURL()

    // 認証ヘッダの取得
    const authHeader = await this.getAuthHeader()

    // ダウンロード開始
    let response: AxiosResponse<ResponseTypeDict[T]>
    try {
      response = await axios({
        url: downloadURL,
        method: 'GET',
        responseType: responseType,
        headers: { ...authHeader },
        onDownloadProgress: e => {
          const { loaded, total } = e
          this.setDownloadedSize(loaded)
          this.setProgress(loaded / total)
        },
        cancelToken: new axios.CancelToken(c => {
          this.m_canceler = c
        }),
      })
    } catch (err) {
      if (!this.canceled) {
        this.setFailed(true)
        throw err
      }
      return
    }

    this.setCompleted(true)

    return response.data
  }

  cancel(): void {
    this.m_canceler && this.m_canceler()
    this.setCanceled(true)
  }
}

class StorageFileHTTPDownloader extends StorageFileDownloader {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_canceler: Canceler | null = null

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ダウンロードを実行します。
   */
  async execute<T extends keyof ResponseTypeDict>(responseType: T): Promise<ResponseTypeDict[T] | undefined> {
    if (this.canceled) return

    this.status = 'running'

    // 認証ヘッダの取得
    const authHeader = await this.getAuthHeader()

    // ダウンロード開始
    let response: AxiosResponse<ResponseTypeDict[T]>
    try {
      response = await axios({
        url: this.fileNode.url,
        method: 'GET',
        responseType: responseType,
        headers: { ...authHeader },
        onDownloadProgress: e => {
          const { loaded, total } = e
          this.setDownloadedSize(loaded)
          this.setProgress(loaded / total)
        },
        cancelToken: new axios.CancelToken(c => {
          this.m_canceler = c
        }),
      })
    } catch (err) {
      if (!this.canceled) {
        this.setFailed(true)
        throw err
      }
      return
    }

    this.setCompleted(true)

    return response.data
  }

  cancel(): void {
    this.m_canceler && this.m_canceler()
    this.setCanceled(true)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageDownloader, StorageFileDownloader, StorageFileDownloaderType }
