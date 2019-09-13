import { GQLStorageNode, gql } from '@/gql'
import { StorageNode, StorageNodeBag } from '@/logic/types'

/**
 * `GQLStorageNode`を`StorageNode`へ変換します。
 * @param gqlNode
 */
export function toStorageNode(gqlNode: GQLStorageNode): StorageNode {
  return {
    nodeType: gqlNode.nodeType,
    name: gqlNode.name,
    dir: gqlNode.dir,
    path: gqlNode.path,
    children: [],
  }
}

/**
 * `GQLStorageNode`の配列を`StorageNodeBag`へ変換します。
 * @param gqlNodes
 */
export function toStorageNodeBag(gqlNodes: GQLStorageNode[]): StorageNodeBag {
  const bag = { list: [], map: {} } as StorageNodeBag

  for (const gqlNode of gqlNodes) {
    const node = toStorageNode(gqlNode)
    bag.list.push(node)
    bag.map[node.path] = node
  }

  for (const node of bag.list) {
    const parent = bag.map[node.dir]
    if (parent) {
      parent.children.push(node)
      node.parent = parent
    }
  }

  return bag
}

/**
 * パス末尾のスラッシュを除去します。
 * @param nodePath
 */
export function removeEndSlash(nodePath?: string): string {
  if (!nodePath) return ''
  return nodePath.replace(/\/$/, '')
}

/**
 * 最長のディレクトリパスを配列に追加します。
 * ```
 * const dirPaths = ['aaa/bbb/ccc1']
 *
 * this.pushMaxDirPathToArray(dirPaths, 'aaa/bbb') // ← 追加されない
 * this.pushMaxDirPathToArray(dirPaths, 'aaa/bbb/ccc1') // ← 追加されない
 * this.pushMaxDirPathToArray(dirPaths, 'aaa/bbb/ccc2') // ← 追加される
 * ```
 *
 * @param dirPaths
 * @param newDirPath
 */
export function pushMaxDirPathToArray(dirPaths: string[], newDirPath: string): void {
  for (let i = 0; i < dirPaths.length; i++) {
    const dirPath = dirPaths[i]
    if (dirPath.startsWith(newDirPath)) {
      return
    } else if (newDirPath.startsWith(dirPath)) {
      dirPaths[i] = newDirPath
      return
    }
  }
  dirPaths.push(newDirPath)
}

/**
 * ファイルのアップロードを実際に行うクラスです。
 */
export class StorageFileUploader {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor(file: File, uploadDirPath: string) {
    this.m_file = file
    this.m_uploadDirPath = removeEndSlash(uploadDirPath)
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get name(): string {
    return this.m_file.name
  }

  get path(): string {
    return `${this.m_uploadDirPath}/${this.name}`
  }

  get size(): number {
    return this.m_file.size
  }

  private m_uploadedSize: number = 0

  get uploadedSize(): number {
    return this.m_uploadedSize
  }

  private m_progress: number = 0

  get progress(): number {
    return this.m_progress
  }

  get completed(): boolean {
    return this.progress === 1
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_uploadDirPath: string

  private m_file: File

  private m_uploadTask!: firebase.storage.UploadTask

  private m_fileRef!: firebase.storage.Reference

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  execute(): void {
    // アップロード先の参照を取得
    this.m_fileRef = firebase.storage().ref(`users/YsRuj2LOtIUbWDtnRygHdPzw1Lu1/${this.m_uploadDirPath}/${this.name}`)
    // アップロード実行
    this.m_uploadTask = this.m_fileRef.put(this.m_file)

    this.m_uploadTask.on(
      firebase.storage.TaskEvent.STATE_CHANGED,
      this.m_uploadTaskOnStateChange.bind(this),
      this.m_uploadTaskOnError.bind(this),
      this.m_uploadTaskOnComplete.bind(this)
    )
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_uploadTaskOnStateChange(snapshot: firebase.storage.UploadTaskSnapshot): void {
    this.m_uploadedSize = snapshot.bytesTransferred
    this.m_progress = snapshot.bytesTransferred / this.size
  }

  private m_uploadTaskOnComplete(): void {
    this.m_uploadedSize = this.size
    this.m_progress = 1
  }

  private m_uploadTaskOnError(err): void {
    throw err
  }
}

/**
 * アップロードの管理を行うマネージャクラスです。
 */
export class StorageUploadManager {
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

  m_uploadingFiles: StorageFileUploader[] = []

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
      result += file.progress === 1 ? 1 : 0
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

  /**
   * アップロードの完了を表すフラグです。
   */
  get completed(): boolean {
    return this.progress === 1
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_uploadFileInput!: HTMLInputElement

  private m_uploadDirPath: string = ''

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
    this.m_uploadDirPath = ''
    this.m_uploading = false
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
  openFolderSelectDialog(uploadDirPath: string): void {
    this.m_openFileSelectDialog(uploadDirPath, true)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_openFileSelectDialog(uploadDirPath: string, isFolder: boolean): void {
    this.m_uploadFileInput.value = ''
    this.m_uploadDirPath = removeEndSlash(uploadDirPath)

    if (isFolder) {
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

  private async m_uploadFileInputOnChange(e) {
    const files: File[] = Array.from(e.target!.files)
    if (files.length === 0) {
      return
    }

    // ファイルアップローダーを作成(まだアップロードは実行しない)
    const dirPaths: string[] = []
    this.m_uploadingFiles.push(
      ...files.map(file => {
        let dirPath = this.m_uploadDirPath
        if ((file as any).webkitRelativePath) {
          const relativePathSegments = (file as any).webkitRelativePath.split('/')
          const relativePath = relativePathSegments.slice(0, relativePathSegments.length - 1).join('/')
          dirPath = `${dirPath}/${relativePath}`
        }
        pushMaxDirPathToArray(dirPaths, dirPath)
        return new StorageFileUploader(file, dirPath)
      })
    )

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

    // アップロード先のディレクトリを作成
    const promises: Promise<any>[] = []
    for (const dirPath of dirPaths) {
      promises.push(gql.createStorageDir(`${dirPath}/`))
    }
    await Promise.all(promises)

    // 実際にアップロードを実行
    for (const uploadingFile of this.m_uploadingFiles) {
      if (!uploadingFile.completed) {
        uploadingFile.execute()
      }
    }
  }
}
