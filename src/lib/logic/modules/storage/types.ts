import { StorageFileUploader } from './base/base-upload'

/**
 * アップロードファイルの情報です。
 */
export interface UploadFileParam {
  data: Blob | Uint8Array | ArrayBuffer | File
  name: string
  dirPath: string
  type?: string
  basePath?: string
}

/**
 * アップロードの管理を行うマネージャです。
 */
export interface StorageUploadManager {
  // アップロード中のファイルです。
  readonly uploadingFiles: StorageFileUploader[]

  // アップロード対象のファイル数です。
  readonly totalUploadCount: number

  // アップロードされたファイル数です。
  readonly uploadedCount: number

  // アップロード対象となる全ファイルのバイト数です。
  readonly totalUploadSize: number

  // アップロード対象となる全ファイルでアップロードされたバイト数です。
  readonly uploadedSize: number

  // アップロード対象となる全ファイルでアップロードされたバイト数です。
  readonly progress: number

  // アップロード中を表すフラグです。
  readonly uploading: boolean

  // アップロードの終了を表すフラグです。
  readonly ended: boolean

  /**
   * 状態をクリアします。
   */
  clear(): void

  /**
   * OSのファイル選択ダイアログを表示します。
   * @param uploadBasePath
   */
  openFilesSelectDialog(uploadBasePath: string): void

  /**
   * OSのフォルダ選択ダイアログを表示します。
   * @param uploadBasePath
   */
  openDirSelectDialog(uploadBasePath: string): void
}
