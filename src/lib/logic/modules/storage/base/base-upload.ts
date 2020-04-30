import * as path from 'path'
import { removeBothEndsSlash, removeEndSlash } from 'web-base-lib'
import { BaseStorageLogic } from './base-storage-logic'
import { StorageUploadManager } from '../types'

/**
 * アップロードファイルの情報です。
 */
export interface UploadFileParam {
  data: Blob | Uint8Array | ArrayBuffer | File
  name: string
  dir: string
  type?: string
  basePath?: string
}

/**
 * アップロードの管理を行うマネージャクラスです。
 */
export abstract class BaseStorageUploadManager implements StorageUploadManager {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor(owner: Element, protected storageLogic: BaseStorageLogic) {
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

  private m_uploadingFiles: StorageFileUploader[] = []

  /**
   * アップロード中のファイルです。
   */
  get uploadingFiles(): StorageFileUploader[] {
    return this.m_uploadingFiles
  }

  /**
   * アップロード対象のファイル数です。
   */
  get totalUploadCount(): number {
    return this.uploadingFiles.length
  }

  /**
   * アップロードされたファイル数です。
   */
  get uploadedCount(): number {
    return this.uploadingFiles.reduce((result, file) => {
      result += file.completed ? 1 : 0
      return result
    }, 0)
  }

  /**
   * アップロード対象となる全ファイルのバイト数です。
   */
  get totalUploadSize(): number {
    return this.uploadingFiles.reduce((result, file) => {
      result += file.size
      return result
    }, 0)
  }

  /**
   * アップロード対象となる全ファイルでアップロードされたバイト数です。
   */
  get uploadedSize(): number {
    return this.uploadingFiles.reduce((result, file) => {
      result += file.uploadedSize
      return result
    }, 0)
  }

  /**
   * アップロードの進捗率です。
   */
  get progress(): number {
    if (this.uploadedSize === 0) return 0
    return this.uploadedSize / this.totalUploadSize
  }

  private m_uploading = false

  /**
   * アップロード中を表すフラグです。
   */
  get uploading(): boolean {
    return this.m_uploading
  }

  private m_ended = false

  /**
   * アップロードの終了を表すフラグです。
   */
  get ended(): boolean {
    return this.m_ended
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected uploadDirPath = ''

  private m_uploadFileInput!: HTMLInputElement

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
    this.m_uploadingFiles.splice(0)
    this.uploadDirPath = ''
    this.m_uploading = false
    this.m_ended = false
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

  protected abstract async verifyExecutable(): Promise<void>

  protected abstract createUploadingFiles(files: File[]): StorageFileUploader[]

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

  private m_openFileSelectDialog(uploadDirPath: string, isDir: boolean): void {
    this.m_uploadFileInput.value = ''
    this.uploadDirPath = removeEndSlash(uploadDirPath)

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
    // このアップロードマネージャーでアップロード可能か検証
    // 検証内容の一例:
    //   + 管理者アップロードの場合、ユーザーに実行権限があるか
    //   + ユーザーアップロードの場合、ユーザーディレクトリがきちんと取得できるか
    await this.verifyExecutable()

    const files: File[] = Array.from(e.target!.files)
    if (files.length === 0) {
      return
    }

    // 変数の初期化
    this.m_uploading = false
    this.m_ended = false

    // ファイルアップローダーを作成(まだアップロードは実行しない)
    this.m_uploadingFiles.push(...this.createUploadingFiles(files))

    // ファイルアップローダー配列をソート
    this.m_uploadingFiles.sort((a, b) => {
      if (a.ended && !b.ended) {
        return 1
      } else if (!a.ended && b.ended) {
        return -1
      }

      if (a.name < b.name) {
        return -1
      } else if (a.name > b.name) {
        return 1
      } else {
        return 0
      }
    })

    // 状態をアップロード中に設定
    this.m_uploading = files.length > 0

    // 実際にアップロードを実行
    for (const uploadingFile of this.m_uploadingFiles) {
      if (uploadingFile.completed) continue
      try {
        // ファイルアップロード
        await uploadingFile.execute()
        // ファイルアップロード後に必要な処理を実行
        await this.storageLogic.handleUploadedFileAPI(removeBothEndsSlash(uploadingFile.path))
      } catch (err) {
        console.error(err)
      }
    }

    this.m_ended = true
  }
}

/**
 * ファイルアップローダーの基底クラスです。
 */
export class StorageFileUploader {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor(uploadParam: UploadFileParam) {
    this.uploadParam = uploadParam
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_uploadedSize = 0

  get uploadedSize(): number {
    return this.m_uploadedSize
  }

  protected setUploadedSize(value: number): void {
    this.m_uploadedSize = value
  }

  private m_progress = 0

  get progress(): number {
    return this.m_progress
  }

  protected setProgress(value: number): void {
    this.m_progress = value
  }

  private m_completed = false

  get completed(): boolean {
    return this.m_completed
  }

  protected setCompleted(value: boolean): void {
    this.m_completed = value
  }

  private m_failed = false

  get failed(): boolean {
    return this.m_failed
  }

  protected setFailed(value: boolean): void {
    this.m_failed = value
  }

  private m_canceled = false

  get canceled(): boolean {
    return this.m_canceled
  }

  protected setCanceled(value: boolean): void {
    this.m_canceled = value
  }

  get ended(): boolean {
    return this.completed || this.failed || this.canceled
  }

  get name(): string {
    return this.uploadParam.name
  }

  get dir(): string {
    return this.uploadParam.dir
  }

  get path(): string {
    return `${removeEndSlash(this.uploadParam.dir)}/${this.name}`
  }

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

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  execute(): Promise<void> {
    if (this.canceled) {
      return Promise.resolve()
    }

    // アップロード先の参照を取得
    const uploadPath = path.join(this.uploadParam.basePath || '', this.uploadParam.dir, this.name)
    this.m_fileRef = firebase.storage().ref(uploadPath)
    // アップロード実行
    this.m_uploadTask = this.m_fileRef.put(this.uploadParam.data)

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
