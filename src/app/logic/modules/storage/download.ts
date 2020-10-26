import { ComputedRef, UnwrapRef, computed, reactive } from '@vue/composition-api'
import { LogicDependency, StorageNodeType } from '@/app/logic/base'
import axios, { AxiosResponse, Canceler } from 'axios'
import { StorageLogic } from '@/app/logic/modules/storage/base'
import path from 'path'
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

/**
 * ファイルまたはディレクトリのダウンロード管理を行うダウンローダーです。
 */
interface StorageDownloader {
  /**
   * ファイルダウンローダーのリストです。
   */
  readonly fileDownloaders: ComputedRef<UnwrapRef<StorageFileDownloader>[]>
  /**
   * ダウンロードするファイルの総数です
   */
  readonly downloadNum: ComputedRef<number>
  /**
   * ダウンロードされたファイル数です。
   */
  readonly downloadedNum: ComputedRef<number>
  /**
   * ダウンロード対象となる全ファイルのバイト数です。
   */
  readonly totalSize: ComputedRef<number>
  /**
   * ダウンロード対象となる全ファイルでダウンロードされたバイト数です。
   */
  readonly downloadedSize: ComputedRef<number>
  /**
   * ダウンロードの進捗率です。
   */
  readonly progress: ComputedRef<number>
  /**
   * ダウンロード中を表すフラグです。
   */
  readonly running: ComputedRef<boolean>
  /**
   * ダウンロード終了を示すフラグです。
   */
  readonly ends: ComputedRef<boolean>
  /**
   * ダウンロードを実行します。
   * 指定されたノードパスがディレクトリの場合、ディレクトリ直下のファイル（ディレクトリは除く）
   * をダウンロードします。指定されたノードパスがファイルの場合はそのファイルのみをダウンロードします。
   * @param type
   * @param nodePath
   */
  download(type: StorageFileDownloaderType, nodePath: string): Generator<UnwrapRef<StorageFileDownloader>, void>
  /**
   * 状態をクリアします。
   */
  clear(): void
  /**
   * ダウンロードをキャンセルします。
   */
  cancel(): void
}

/**
 * 単一ファイルダウンロードの管理を行うダウンローダーです。
 */
interface StorageFileDownloader {
  /**
   * ダウンロードが完了（成功）したかを示すフラグです。
   */
  readonly completed: ComputedRef<boolean>
  /**
   * ダウンロードが失敗したかを示すフラグです。
   */
  readonly failed: ComputedRef<boolean>
  /**
   * ダウンロードがキャンセルされたかを示すフラグです。
   */
  readonly canceled: ComputedRef<boolean>
  /**
   * ダウンロード中を示すフラグです。
   */
  readonly running: ComputedRef<boolean>
  /**
   * ダウンロード終了を示すフラグです。
   */
  readonly ends: ComputedRef<boolean>
  /**
   * ダウンロードされたバイト数です。
   */
  readonly downloadedSize: ComputedRef<number>
  /**
   * ダウンロードの進捗率です。
   */
  readonly progress: ComputedRef<number>
  /**
   * ダウンロードファイルのファイル名です。
   */
  readonly name: ComputedRef<string>
  /**
   * ダウンロードファイルの格納されているディレクトリです。
   */
  readonly dir: ComputedRef<string>
  /**
   * ダウンロードファイルのパスです。
   */
  readonly path: ComputedRef<string>
  /**
   * ダウンロードファイルのファイルサイズ（バイト）です。
   */
  readonly size: ComputedRef<number>
  /**
   * ダウンロードファイルのコンテンツタイプです。
   */
  readonly contentType: ComputedRef<string>
  /**
   * ダウンロードを実行します。
   */
  execute<T extends keyof ResponseTypeDict>(responseType: T): Promise<ResponseTypeDict[T] | undefined>
  /**
   * ダウンロードをキャンセルします。
   */
  cancel(): void
}

interface StorageDownloaderDependency extends LogicDependency {
  storageLogic: StorageLogic
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageDownloader {
  export function newInstance(dependency: StorageDownloaderDependency): StorageDownloader {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const { storageLogic } = dependency

    const state = reactive({
      status: 'none' as 'none' | 'running' | 'ends',
      fileDownloaders: [] as StorageFileDownloader[],
    })

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const fileDownloaders = computed(() => [...state.fileDownloaders])

    const downloadNum = computed(() => fileDownloaders.value.length)

    const downloadedNum = computed(() => {
      return fileDownloaders.value.reduce((result, file) => {
        result += file.completed ? 1 : 0
        return result
      }, 0)
    })

    const totalSize = computed(() => {
      return fileDownloaders.value.reduce((result, file) => {
        result += file.size
        return result
      }, 0)
    })

    const downloadedSize = computed(() => {
      return fileDownloaders.value.reduce((result, file) => {
        result += file.downloadedSize
        return result
      }, 0)
    })

    const progress = computed(() => {
      if (downloadedSize.value === 0) return 0
      return downloadedSize.value / totalSize.value
    })

    const running = computed(() => {
      return state.status === 'running'
    })

    const ends = computed(() => {
      return state.status === 'ends'
    })

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const download: StorageDownloader['download'] = function*(
      type: StorageFileDownloaderType,
      nodePath: string
    ): Generator<UnwrapRef<StorageFileDownloader>, void> {
      nodePath = removeBothEndsSlash(nodePath)
      clear()
      state.status = 'running'

      const node = storageLogic.getNode({ path: nodePath })
      if (!node) {
        throw new Error(`The specified node '${path.join(storageLogic.basePath.value, nodePath)}' does not exist.`)
      }

      switch (node.nodeType) {
        case StorageNodeType.Dir: {
          const _fileDownloaders = storageLogic.getChildren(nodePath).reduce((result, node) => {
            if (node.nodeType === StorageNodeType.Dir) return result
            result.push(newFileDownloader(type, node.path))
            return result
          }, [] as UnwrapRef<StorageFileDownloader>[])
          fileDownloaders.value.push(..._fileDownloaders)
          break
        }
        case StorageNodeType.File: {
          fileDownloaders.value.push(newFileDownloader(type, node.path))
          break
        }
      }

      for (const downloader of fileDownloaders.value) {
        yield downloader
      }

      state.status = 'ends'
    }

    const clear: StorageDownloader['clear'] = () => {
      fileDownloaders.value.splice(0)
      state.status = 'none'
    }

    const cancel: StorageDownloader['cancel'] = () => {
      for (const downloader of fileDownloaders.value) {
        downloader.cancel()
      }
      state.status = 'ends'
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    function newFileDownloader(type: StorageFileDownloaderType, filePath: string) {
      return reactive(StorageFileDownloader.newInstance(storageLogic, type, filePath))
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      fileDownloaders,
      downloadNum,
      downloadedNum,
      totalSize,
      downloadedSize,
      progress,
      running,
      ends,
      download,
      clear,
      cancel,
    }
  }
}

namespace StorageFileDownloader {
  export function newInstance(storageLogic: StorageLogic, type: StorageFileDownloaderType, filePath: string): StorageFileDownloader {
    switch (type) {
      case 'firebase':
        return StorageFileFirebaseDownloader.newInstance(storageLogic, filePath)
      case 'http':
        return StorageFileHTTPDownloader.newInstance(storageLogic, filePath)
    }
  }

  export function newBaseInstance(storageLogic: StorageLogic, filePath: string) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const state = reactive({
      status: 'none' as 'none' | 'running' | 'ends',
      completed: false,
      failed: false,
      canceled: false,
      downloadedSize: 0,
      progress: 0,
    })

    const fileNode = storageLogic.sgetNode({ path: filePath })

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const status = computed({
      get: () => state.status,
      set: value => (state.status = value),
    })

    const completed = computed({
      get: () => state.completed,
      set: value => {
        state.completed = value
        state.status = 'ends'
      },
    })

    const failed = computed({
      get: () => state.failed,
      set: value => {
        state.failed = value
        state.status = 'ends'
      },
    })

    const canceled = computed({
      get: () => state.canceled,
      set: value => {
        state.canceled = value
        state.status = 'ends'
      },
    })

    const running = computed(() => state.status === 'running')

    const ends = computed(() => state.status === 'ends')

    const downloadedSize = computed({
      get: () => state.downloadedSize,
      set: value => (state.downloadedSize = value),
    })

    const progress = computed({
      get: () => state.progress,
      set: value => (state.progress = value),
    })

    const name = computed(() => fileNode.name)

    const dir = computed(() => fileNode.dir)

    const path = computed(() => fileNode.path)

    const size = computed(() => fileNode.size)

    const contentType = computed(() => fileNode.contentType)

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    /**
     * リクエスト用の認証ヘッダを取得します。
     */
    async function getAuthHeader(): Promise<{ Authorization?: string }> {
      const currentUser = firebase.auth().currentUser
      if (!currentUser) return {}

      const idToken = await currentUser.getIdToken()
      if (!idToken) return {}

      return {
        Authorization: `Bearer ${idToken}`,
      }
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      fileNode,
      status,
      completed,
      failed,
      canceled,
      running,
      ends,
      downloadedSize,
      progress,
      name,
      dir,
      path,
      size,
      contentType,
      getAuthHeader,
    }
  }
}

namespace StorageFileFirebaseDownloader {
  export function newInstance(storageLogic: StorageLogic, filePath: string): StorageFileDownloader {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const base = StorageFileDownloader.newBaseInstance(storageLogic, filePath)

    let canceler: Canceler | null = null

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const execute: StorageFileDownloader['execute'] = async <T extends keyof ResponseTypeDict>(responseType: T) => {
      if (base.canceled.value) return undefined

      base.status.value = 'running'

      // URLの取得
      const downloadFilePath = removeBothEndsSlash(path.join(storageLogic.basePath.value, base.fileNode.path))
      const fileRef = firebase.storage().ref(downloadFilePath)
      const downloadURL = await fileRef.getDownloadURL()

      // 認証ヘッダの取得
      const authHeader = await base.getAuthHeader()

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
            base.downloadedSize.value = loaded
            base.progress.value = loaded / total
          },
          cancelToken: new axios.CancelToken(c => {
            canceler = c
          }),
        })
      } catch (err) {
        if (!base.canceled.value) {
          base.failed.value = true
          throw err
        }
        return
      }

      base.completed.value = true

      return response.data
    }

    const cancel: StorageFileDownloader['cancel'] = () => {
      canceler && canceler()
      base.canceled.value = true
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      execute,
      cancel,
    }
  }
}

namespace StorageFileHTTPDownloader {
  export function newInstance(storageLogic: StorageLogic, filePath: string): StorageFileDownloader {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const base = StorageFileDownloader.newBaseInstance(storageLogic, filePath)

    let canceler: Canceler | null = null

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const execute: StorageFileDownloader['execute'] = async <T extends keyof ResponseTypeDict>(responseType: T) => {
      if (base.canceled.value) return

      base.status.value = 'running'

      // 認証ヘッダの取得
      const authHeader = await base.getAuthHeader()

      // ダウンロード開始
      let response: AxiosResponse<ResponseTypeDict[T]>
      try {
        response = await axios({
          url: base.fileNode.url,
          method: 'GET',
          responseType: responseType,
          headers: { ...authHeader },
          onDownloadProgress: e => {
            const { loaded, total } = e
            base.downloadedSize.value = loaded
            base.progress.value = loaded / total
          },
          cancelToken: new axios.CancelToken(c => {
            canceler = c
          }),
        })
      } catch (err) {
        if (!base.canceled.value) {
          base.failed.value = true
          throw err
        }
        return
      }

      base.completed.value = true

      return response.data
    }

    const cancel: StorageFileDownloader['cancel'] = () => {
      canceler && canceler()
      base.canceled.value = true
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      ...base,
      execute,
      cancel,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageDownloader, StorageFileDownloader, StorageFileDownloaderType }
