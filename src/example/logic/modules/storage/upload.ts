import * as path from 'path'
import { removeBothEndsSlash, splitHierarchicalPaths } from 'web-base-lib'
import { StorageLogic } from '@/example/logic/modules/storage/logic'

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
  type: string
}

//========================================================================
//
//  Implementation
//
//========================================================================

/**
 * ファイルまたディレクトリのアップロード管理を行うアップローダーです。
 */
class StorageUploader {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor(protected storageLogic: StorageLogic, owner: Element) {
    this.m_uploadFileInput = document.createElement('input')
    this.m_uploadFileInput.style.display = 'none'
    this.m_uploadFileInput.setAttribute('type', 'file')
    this.m_uploadFileInput.addEventListener('change', this.m_uploadFileInputOnChange.bind(this))
    owner.appendChild(this.m_uploadFileInput)
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_fileUploaders: StorageFileUploader[] = []

  /**
   * アップロード中のファイルです。
   */
  get fileUploaders(): StorageFileUploader[] {
    return this.m_fileUploaders
  }

  /**
   * アップロードするファイルの総数です
   */
  get uploadNum(): number {
    return this.fileUploaders.length
  }

  /**
   * アップロードされたファイル数です。
   */
  get uploadedNum(): number {
    return this.fileUploaders.reduce((result, file) => {
      result += file.completed ? 1 : 0
      return result
    }, 0)
  }

  /**
   * アップロード対象となる全ファイルのバイト数です。
   */
  get totalSize(): number {
    return this.fileUploaders.reduce((result, file) => {
      result += file.size
      return result
    }, 0)
  }

  /**
   * アップロード対象となる全ファイルでアップロードされたバイト数です。
   */
  get uploadedSize(): number {
    return this.fileUploaders.reduce((result, file) => {
      result += file.uploadedSize
      return result
    }, 0)
  }

  /**
   * アップロードの進捗率です。
   */
  get progress(): number {
    if (this.uploadedSize === 0) return 0
    return this.uploadedSize / this.totalSize
  }

  /**
   * アップロード中を表すフラグです。
   */
  get running(): boolean {
    return this.m_status === 'running'
  }

  /**
   * アップロード終了を表すフラグです。
   */
  get ends(): boolean {
    return this.m_status === 'ends'
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected uploadDirPath = ''

  private m_uploadFileInput!: HTMLInputElement

  private m_status: 'none' | 'running' | 'ends' = 'none'

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * 状態をクリアします。
   */
  clear(): void {
    this.m_uploadFileInput.value = ''
    this.m_fileUploaders.splice(0)
    this.uploadDirPath = ''
    this.m_status = 'none'
  }

  /**
   * OSのファイル選択ダイアログを表示します。
   * @param uploadDirPath
   */
  openFilesSelectDialog(uploadDirPath: string): void {
    this.m_openFileSelectDialog(uploadDirPath, false)
  }

  /**
   * OSのフォルダ選択ダイアログを表示します。
   * @param uploadDirPath
   */
  openDirSelectDialog(uploadDirPath: string): void {
    this.m_openFileSelectDialog(uploadDirPath, true)
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
  protected getUploadDirPath(file: File): string {
    let result = this.uploadDirPath
    if ((file as any).webkitRelativePath) {
      const relativePathSegments = (file as any).webkitRelativePath.split('/')
      const relativePath = relativePathSegments.slice(0, relativePathSegments.length - 1).join('/')
      result = `${result}/${relativePath}`
    }
    return result
  }

  protected createUploadingFiles(files: File[]): StorageFileUploader[] {
    const result: StorageFileUploader[] = []
    for (const file of files) {
      const fileUploader = new StorageFileUploader(this.storageLogic, {
        data: file,
        name: file.name,
        dir: removeBothEndsSlash(this.getUploadDirPath(file)),
        type: file.type,
      })
      result.push(fileUploader)
    }
    return result
  }

  private m_openFileSelectDialog(uploadDirPath: string, isDir: boolean): void {
    this.m_uploadFileInput.value = ''
    this.uploadDirPath = removeBothEndsSlash(uploadDirPath)

    if (isDir) {
      this.m_uploadFileInput.setAttribute('webkitdirectory', '')
      this.m_uploadFileInput.removeAttribute('multiple')
    } else {
      this.m_uploadFileInput.setAttribute('multiple', '')
      this.m_uploadFileInput.removeAttribute('webkitdirectory')
    }

    const event = document.createEvent('MouseEvents')
    event.initEvent('click', true, false)
    this.m_uploadFileInput.dispatchEvent(event)
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * OSのファイルまたはフォルダ選択ダイアログで変更があった際のリスナです。
   * @param e
   */
  private async m_uploadFileInputOnChange(e) {
    const files: File[] = Array.from(e.target!.files)
    if (files.length === 0) {
      return
    }

    this.m_status = 'none'

    // ファイルアップローダーを作成(まだアップロードは実行しない)
    this.m_fileUploaders.push(...this.createUploadingFiles(files))

    // ファイルアップローダー配列をソート
    this.m_fileUploaders.sort((a, b) => {
      if (a.ends && !b.ends) {
        return 1
      } else if (!a.ends && b.ends) {
        return -1
      }

      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    })

    // 状態をアップロード中に設定
    this.m_status = 'running'

    // アップロードファイルを格納するディレクトリを作成
    const dirPaths = splitHierarchicalPaths(...this.m_fileUploaders.map(item => item.dir)).filter(dir => {
      if (this.uploadDirPath) {
        return dir.startsWith(path.join(this.uploadDirPath, '/'))
      } else {
        return dir
      }
    })
    for (const dirPath of dirPaths) {
      await this.storageLogic.createDir(dirPath)
    }

    // 実際にアップロードを実行
    for (const uploadingFile of this.m_fileUploaders) {
      if (uploadingFile.completed) continue
      try {
        // ファイルアップロード
        await uploadingFile.execute()
        // ファイルアップロード後に必要な処理を実行
        await this.storageLogic.handleUploadedFileAPI(uploadingFile.path)
      } catch (err) {
        console.error(err)
      }
    }

    // 状態をアップロード終了に設定
    this.m_status = 'ends'
  }
}

/**
 * 単一ファイルのアップロード管理を行うアップローダーです。
 */
class StorageFileUploader {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor(protected storageLogic: StorageLogic, uploadParam: UploadFileParam) {
    this.uploadParam = uploadParam
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_completed = false

  /**
   * アップロードが完了（成功）したかを示すフラグです。
   */
  get completed(): boolean {
    return this.m_completed
  }

  protected setCompleted(value: boolean): void {
    this.m_completed = value
    this.m_status = 'ends'
  }

  private m_failed = false

  /**
   * アップロードが失敗したかを示すフラグです。
   */
  get failed(): boolean {
    return this.m_failed
  }

  protected setFailed(value: boolean): void {
    this.m_failed = value
    this.m_status = 'ends'
  }

  private m_canceled = false

  /**
   * アップロードがキャンセルされたかを示すフラグです。
   */
  get canceled(): boolean {
    return this.m_canceled
  }

  protected setCanceled(value: boolean): void {
    this.m_canceled = value
    this.m_status = 'ends'
  }

  /**
   * ダウンロード中を示すフラグです。
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

  private m_uploadedSize = 0

  /**
   * アップロードされたバイト数です。
   */
  get uploadedSize(): number {
    return this.m_uploadedSize
  }

  protected setUploadedSize(value: number): void {
    this.m_uploadedSize = value
  }

  private m_progress = 0

  /**
   * アップロードの進捗率です。
   */
  get progress(): number {
    return this.m_progress
  }

  protected setProgress(value: number): void {
    this.m_progress = value
  }

  /**
   * アップロードファイルのファイル名です。
   */
  get name(): string {
    return this.uploadParam.name
  }

  /**
   * アップロードファイルが格納されるディレクトリです。
   */
  get dir(): string {
    return this.uploadParam.dir
  }

  /**
   * アップロードファイルのパスです。
   */
  get path(): string {
    return path.join(this.uploadParam.dir, this.name)
  }

  /**
   * アップロードファイルのファイルサイズ（バイト）です。
   */
  get size(): number {
    if (this.uploadParam.data instanceof File || this.uploadParam.data instanceof Blob) {
      return this.uploadParam.data.size
    } else {
      return this.uploadParam.data.byteLength
    }
  }

  get type(): string {
    return this.uploadParam.type || ''
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected uploadParam: UploadFileParam

  private m_uploadTask!: firebase.storage.UploadTask

  private m_fileRef!: firebase.storage.Reference

  private m_status: 'none' | 'running' | 'ends' = 'none'

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  execute(): Promise<void> {
    if (this.canceled) {
      return Promise.resolve()
    }

    this.m_status = 'running'

    // ファイルノードの新バージョン番号を取得
    const node = this.storageLogic.getNode({ path: this.path })
    const version = String(!node || !node.version ? 0 : node.version + 1) // バージョン番号をインクリメント

    // アップロード先の参照を取得
    const basePath = removeBothEndsSlash(this.storageLogic.basePath)
    const uploadPath = path.join(basePath, this.uploadParam.dir, this.name)
    this.m_fileRef = firebase.storage().ref(uploadPath)

    // アップロード実行
    this.m_uploadTask = this.m_fileRef.put(this.uploadParam.data, {
      customMetadata: { version },
    })

    return new Promise<void>((resolve, reject) => {
      this.m_uploadTask.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        (snapshot: firebase.storage.UploadTaskSnapshot) => {
          this.setUploadedSize(snapshot.bytesTransferred)
          this.setProgress(snapshot.bytesTransferred / snapshot.totalBytes)
        },
        err => {
          if (this.canceled) {
            resolve()
          } else {
            this.setFailed(true)
            reject(err)
          }
        },
        () => {
          this.setCompleted(true)
          resolve()
        }
      )
    })
  }

  cancel(): void {
    this.m_uploadTask && this.m_uploadTask.cancel()
    this.setCanceled(true)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { UploadFileParam, StorageUploader, StorageFileUploader }
