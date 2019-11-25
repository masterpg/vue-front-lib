import { api } from '../../api'
import { removeEndSlash } from 'web-base-lib'

/**
 * アップロードファイルの情報です。
 */
export interface UploadFileParam {
  data: Blob | Uint8Array | ArrayBuffer | File
  name: string
  dirPath: string
  type?: string
}

/**
 * アップロードの管理を行うマネージャクラスです。
 */
export abstract class StorageUploadManager {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor(owner: Element) {
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

  protected uploadBasePath: string = ''

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
    this.uploadBasePath = ''
    this.m_uploading = false
    this.m_ended = false
  }

  /**
   * OSのファイル選択ダイアログを表示します。
   * @param uploadBasePath
   */
  openFilesSelectDialog(uploadBasePath: string): void {
    this.m_openFileSelectDialog(uploadBasePath, false)
  }

  /**
   * OSのフォルダ選択ダイアログを表示します。
   * @param uploadBasePath
   */
  openDirSelectDialog(uploadBasePath: string): void {
    this.m_openFileSelectDialog(uploadBasePath, true)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected abstract createUploadingFiles(files: File[]): StorageFileUploader[]

  protected abstract beforeUpload(): Promise<void>

  /**
   * 指定されたファイルのディレクトリ構造をもとにアップロード先のディレクトリを取得します。
   * @param file
   */
  protected getUploadDirPath(file: File): string {
    let result = this.uploadBasePath
    if ((file as any).webkitRelativePath) {
      const relativePathSegments = (file as any).webkitRelativePath.split('/')
      const relativePath = relativePathSegments.slice(0, relativePathSegments.length - 1).join('/')
      result = `${result}/${relativePath}`
    }
    return result
  }

  private m_openFileSelectDialog(uploadBasePath: string, isDir: boolean): void {
    this.m_uploadFileInput.value = ''
    this.uploadBasePath = removeEndSlash(uploadBasePath)

    if (isDir) {
      this.m_uploadFileInput.setAttribute('webkitdirectory', '')
    } else {
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
   * OSのファイルまたはフォルダ選択ダイアログで変更があった際のリスなです。
   * @param e
   */
  private async m_uploadFileInputOnChange(e) {
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
      if (a.completed && !b.completed) {
        return 1
      } else if (!a.completed && b.completed) {
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

    // アップロード前処理を実行
    await this.beforeUpload()

    // アップロード先のディレクトリを作成
    const createdDirPaths = this.m_uploadingFiles.reduce<string[]>((result, item) => {
      if (item.dirPath) {
        result.push(`${item.dirPath}/`)
      }
      return result
    }, [])
    if (createdDirPaths.length > 0) {
      await api.createUserStorageDirs(createdDirPaths)
    }

    // 実際にアップロードを実行
    const uploadPromises: Promise<void>[] = []
    for (const uploadingFile of this.m_uploadingFiles) {
      if (uploadingFile.completed) continue
      const uploadPromise = uploadingFile.execute().catch(err => {
        console.error(err)
      })
      uploadPromises.push(uploadPromise)
    }
    Promise.all(uploadPromises).then(() => {
      this.m_ended = true
    })
  }
}

/**
 * ファイルアップローダーの基底クラスです。
 */
export abstract class StorageFileUploader {
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

  abstract readonly uploadedSize: number

  abstract readonly progress: number

  abstract readonly completed: boolean

  abstract readonly failed: boolean

  get name(): string {
    return this.uploadParam.name
  }

  get dirPath(): string {
    return this.uploadParam.dirPath
  }

  get path(): string {
    return `${removeEndSlash(this.uploadParam.dirPath)}/${this.name}`
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

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  abstract execute(): Promise<void>
}
