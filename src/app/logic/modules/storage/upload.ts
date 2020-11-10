import { ComputedRef, Ref, UnwrapRef, computed, reactive, ref, watch } from '@vue/composition-api'
import { removeBothEndsSlash, splitHierarchicalPaths } from 'web-base-lib'
import { StorageLogic } from '@/app/logic/modules/storage/base'
import _path from 'path'
import { extendedMethod } from '@/app/base'

//========================================================================
//
//  Interfaces
//
//========================================================================

/**
 * アップロードファイルの情報です。
 */
interface UploadFileParam {
  data: Blob | Uint8Array | ArrayBuffer | File
  name: string
  dir: string
  contentType: string
}

/**
 * ファイルまたディレクトリのアップロード管理を行うアップローダーです。
 */
interface StorageUploader {
  /**
   * アップロード中のファイルです。
   */
  readonly fileUploaders: ComputedRef<UnwrapRef<StorageFileUploader>[]>
  /**
   * アップロードするファイルの総数です
   */
  readonly uploadNum: ComputedRef<number>
  /**
   * アップロードされたファイル数です。
   */
  readonly uploadedNum: ComputedRef<number>
  /**
   * アップロード対象となる全ファイルのバイト数です。
   */
  readonly totalSize: ComputedRef<number>
  /**
   * アップロード対象となる全ファイルでアップロードされたバイト数です。
   */
  readonly uploadedSize: ComputedRef<number>
  /**
   * アップロードの進捗率です。
   */
  readonly progress: ComputedRef<number>
  /**
   * アップロード中を表すフラグです。
   */
  readonly running: ComputedRef<boolean>
  /**
   * アップロード終了を表すフラグです。
   */
  readonly ends: ComputedRef<boolean>
  /**
   * 状態をクリアします。
   */
  clear(): void
  /**
   * OSのファイル選択ダイアログを表示します。
   * @param uploadDirPath
   */
  openFilesSelectDialog(uploadDirPath: string): void
  /**
   * OSのフォルダ選択ダイアログを表示します。
   * @param uploadDirPath
   */
  openDirSelectDialog(uploadDirPath: string): void
}

/**
 * 単一ファイルのアップロード管理を行うアップローダーです。
 */
interface StorageFileUploader {
  /**
   * アップロードが完了（成功）したかを示すフラグです。
   */
  readonly completed: ComputedRef<boolean>
  /**
   * アップロードが失敗したかを示すフラグです。
   */
  readonly failed: ComputedRef<boolean>
  /**
   * アップロードがキャンセルされたかを示すフラグです。
   */
  readonly canceled: ComputedRef<boolean>
  /**
   * アップロード中を示すフラグです。
   */
  readonly running: ComputedRef<boolean>
  /**
   * アップロード終了を示すフラグです。
   */
  readonly ends: ComputedRef<boolean>
  /**
   * アップロードされたバイト数です。
   */
  readonly uploadedSize: ComputedRef<number>
  /**
   * アップロードの進捗率です。
   */
  readonly progress: ComputedRef<number>
  /**
   * アップロードファイルのファイル名です。
   */
  readonly name: ComputedRef<string>
  /**
   * アップロードファイルが格納されるディレクトリです。
   */
  readonly dir: ComputedRef<string>
  /**
   * アップロードファイルのパスです。
   */
  readonly path: ComputedRef<string>
  /**
   * アップロードファイルのファイルサイズ（バイト）です。
   */
  readonly size: ComputedRef<number>
  /**
   * アップロードファイルのコンテンツタイプです。
   */
  readonly contentType: ComputedRef<string>
  /**
   * アップロードを実行します。
   */
  execute(): Promise<void>
  /**
   * アップロードをキャンセルします。
   */
  cancel(): void
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageUploader {
  export function newInstance(storageLogic: StorageLogic, owner: Ref<Element | undefined>): StorageUploader {
    return newRawInstance(storageLogic, owner)
  }

  export function newRawInstance(storageLogic: StorageLogic, owner: Ref<Element | undefined>) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const state = reactive({
      status: 'none' as 'none' | 'running' | 'ends',
      uploadDirPath: '',
    })

    let uploadFileInput: HTMLInputElement = null as any

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const _fileUploaders = ref<StorageFileUploader[]>([])
    const fileUploaders = computed(() => _fileUploaders.value)

    const uploadNum = computed(() => fileUploaders.value.length)

    const uploadedNum = computed(() => {
      return fileUploaders.value.reduce((result, file) => {
        result += file.completed ? 1 : 0
        return result
      }, 0)
    })

    const totalSize = computed(() => {
      return fileUploaders.value.reduce((result, file) => {
        result += file.size
        return result
      }, 0)
    })

    const uploadedSize = computed(() => {
      return fileUploaders.value.reduce((result, file) => {
        result += file.uploadedSize
        return result
      }, 0)
    })

    const progress = computed(() => {
      if (uploadedSize.value === 0) return 0
      return uploadedSize.value / totalSize.value
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

    const clear: StorageUploader['clear'] = () => {
      uploadFileInput.value = ''
      fileUploaders.value.splice(0)
      state.uploadDirPath = ''
      state.status = 'none'
    }

    const openFilesSelectDialog: StorageUploader['openFilesSelectDialog'] = uploadDirPath => {
      openFileSelectDialog(uploadDirPath, false)
    }

    const openDirSelectDialog: StorageUploader['openDirSelectDialog'] = uploadDirPath => {
      openFileSelectDialog(uploadDirPath, true)
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    /**
     * 指定されたファイルのディレクトリ構造をもとにアップロード先のディレクトリを取得します。
     * @param file
     */
    function getUploadDirPath(file: File): string {
      let result = state.uploadDirPath
      if ((file as any).webkitRelativePath) {
        const relativePathSegments = (file as any).webkitRelativePath.split('/')
        const relativePath = relativePathSegments.slice(0, relativePathSegments.length - 1).join('/')
        result = `${result}/${relativePath}`
      }
      return result
    }

    const createUploadingFiles = extendedMethod((files: File[]) => {
      const result: UnwrapRef<StorageFileUploader>[] = []
      for (const file of files) {
        const fileUploader = reactive(
          StorageFileUploader.newInstance(storageLogic, {
            data: file,
            name: file.name,
            dir: removeBothEndsSlash(getUploadDirPath(file)),
            contentType: file.type,
          })
        )
        result.push(fileUploader)
      }
      return result
    })

    function openFileSelectDialog(uploadDirPath: string, isDir: boolean): void {
      uploadFileInput.value = ''
      state.uploadDirPath = removeBothEndsSlash(uploadDirPath)

      if (isDir) {
        uploadFileInput.setAttribute('webkitdirectory', '')
        uploadFileInput.removeAttribute('multiple')
      } else {
        uploadFileInput.setAttribute('multiple', '')
        uploadFileInput.removeAttribute('webkitdirectory')
      }

      const event = document.createEvent('MouseEvents')
      event.initEvent('click', true, false)
      uploadFileInput.dispatchEvent(event)
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    watch(
      () => owner.value,
      () => {
        uploadFileInput = document.createElement('input')
        uploadFileInput.style.display = 'none'
        uploadFileInput.setAttribute('type', 'file')
        uploadFileInput.addEventListener('change', uploadFileInputOnChange)
        owner.value!.appendChild(uploadFileInput)
      }
    )

    /**
     * OSのファイルまたはフォルダ選択ダイアログで変更があった際のリスナです。
     * @param e
     */
    async function uploadFileInputOnChange(e: any) {
      const files: File[] = Array.from(e.target.files)
      if (files.length === 0) {
        return
      }

      state.status = 'none'

      // ファイルアップローダーを作成(まだアップロードは実行しない)
      fileUploaders.value.push(...createUploadingFiles.value(files))

      // ファイルアップローダー配列をソート
      fileUploaders.value.sort((a, b) => {
        if (a.ends && !b.ends) {
          return 1
        } else if (!a.ends && b.ends) {
          return -1
        }

        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
      })

      // 状態をアップロード中に設定
      state.status = 'running'

      // アップロードファイルを格納するディレクトリを作成
      const dirPaths = splitHierarchicalPaths(...fileUploaders.value.map(item => item.dir)).filter(dir => {
        if (state.uploadDirPath) {
          return dir.startsWith(_path.join(state.uploadDirPath, '/'))
        } else {
          return dir
        }
      })
      for (const dirPath of dirPaths) {
        await storageLogic.createDir(dirPath)
      }

      // 実際にアップロードを実行
      for (const uploadingFile of fileUploaders.value) {
        if (uploadingFile.completed) continue
        try {
          // ファイルアップロード
          await uploadingFile.execute()
          // ファイルアップロード後に必要な処理を実行
          await storageLogic.handleUploadedFile(uploadingFile.path)
        } catch (err) {
          console.error(err)
        }
      }

      // 状態をアップロード終了に設定
      state.status = 'ends'
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      fileUploaders,
      uploadedNum,
      uploadNum,
      totalSize,
      uploadedSize,
      progress,
      running,
      ends,
      clear,
      openFilesSelectDialog,
      openDirSelectDialog,
      getUploadDirPath,
      createUploadingFiles,
    }
  }
}

namespace StorageFileUploader {
  export function newInstance(storageLogic: StorageLogic, uploadParam: UploadFileParam): StorageFileUploader {
    return newRawInstance(storageLogic, uploadParam)
  }

  export function newRawInstance(storageLogic: StorageLogic, uploadParam: UploadFileParam) {
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
      uploadedSize: 0,
      progress: 0,
    })

    let uploadTask: firebase.storage.UploadTask | undefined

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

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

    const uploadedSize = computed({
      get: () => state.uploadedSize,
      set: value => (state.uploadedSize = value),
    })

    const progress = computed({
      get: () => state.progress,
      set: value => (state.progress = value),
    })

    const name = computed(() => uploadParam.name)

    const dir = computed(() => uploadParam.dir)

    const path = computed(() => _path.join(dir.value, name.value))

    const size = computed(() => {
      if (uploadParam.data instanceof File || uploadParam.data instanceof Blob) {
        return uploadParam.data.size
      } else {
        return uploadParam.data.byteLength
      }
    })

    const contentType = computed(() => uploadParam.contentType ?? '')

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const execute = extendedMethod<StorageFileUploader['execute']>(async () => {
      if (canceled.value) {
        return Promise.resolve()
      }

      state.status = 'running'

      // ファイルノードの新バージョン番号を取得
      const node = storageLogic.getNode({ path: path.value })
      const version = node ? String(node.version + 1) : '1'

      // アップロード先の参照を取得
      const basePath = removeBothEndsSlash(storageLogic.basePath.value)
      const uploadPath = _path.join(basePath, path.value)
      const fileRef = firebase.storage().ref(uploadPath)

      // アップロード実行
      uploadTask = fileRef.put(uploadParam.data, {
        customMetadata: { version },
      })

      return new Promise<void>((resolve, reject) => {
        uploadTask!.on(
          firebase.storage.TaskEvent.STATE_CHANGED,
          (snapshot: firebase.storage.UploadTaskSnapshot) => {
            uploadedSize.value = snapshot.bytesTransferred
            progress.value = snapshot.bytesTransferred / snapshot.totalBytes
          },
          err => {
            if (canceled.value) {
              resolve()
            } else {
              failed.value = true
              reject(err)
            }
          },
          () => {
            completed.value = true
            resolve()
          }
        )
      })
    })

    const cancel = extendedMethod<StorageFileUploader['cancel']>(async () => {
      uploadTask?.cancel()
      canceled.value = true
    })

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      completed,
      failed,
      canceled,
      running,
      ends,
      uploadedSize,
      progress,
      name,
      dir,
      path,
      size,
      contentType,
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

export { UploadFileParam, StorageUploader, StorageFileUploader }
