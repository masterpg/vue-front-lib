import { Dayjs } from 'dayjs'

//========================================================================
//
//  API
//
//========================================================================

export interface LibAPIContainer {
  getAppConfig(): Promise<AppConfigResponse>

  getCustomToken(): Promise<string>

  //--------------------------------------------------
  //  User storage
  //--------------------------------------------------

  getUserStorageNode(nodePath: string): Promise<StorageNode | undefined>

  getUserStorageDirDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getUserStorageDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getUserStorageDirChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getUserStorageChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getUserStorageHierarchicalNodes(nodePath: string): Promise<StorageNode[]>

  getUserStorageAncestorDirs(nodePath: string): Promise<StorageNode[]>

  handleUploadedUserFile(filePath: string): Promise<StorageNode>

  createUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeUserStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string): Promise<StoragePaginationResult>

  removeUserStorageFile(filePath: string): Promise<StorageNode | undefined>

  moveUserStorageDir(options: StoragePaginationOptionsInput | null, fromDirPath: string, toDirPath: string): Promise<StoragePaginationResult>

  moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode>

  renameUserStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string, newName: string): Promise<StoragePaginationResult>

  renameUserStorageFile(filePath: string, newName: string): Promise<StorageNode>

  setUserStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  setUserStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  //--------------------------------------------------
  //  Application storage
  //--------------------------------------------------

  getStorageNode(nodePath: string): Promise<StorageNode | undefined>

  getStorageDirDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageDirChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult>

  getStorageHierarchicalNodes(nodePath: string): Promise<StorageNode[]>

  getStorageAncestorDirs(nodePath: string): Promise<StorageNode[]>

  handleUploadedFile(filePath: string): Promise<StorageNode>

  createStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string): Promise<StoragePaginationResult>

  removeStorageFile(filePath: string): Promise<StorageNode | undefined>

  moveStorageDir(options: StoragePaginationOptionsInput | null, fromDirPath: string, toDirPath: string): Promise<StoragePaginationResult>

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode>

  renameStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string, newName: string): Promise<StoragePaginationResult>

  renameStorageFile(filePath: string, newName: string): Promise<StorageNode>

  setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  getSignedUploadUrls(params: { filePath: string; contentType?: string }[]): Promise<string[]>

  //--------------------------------------------------
  //  Helpers
  //--------------------------------------------------

  /**
   * ページングが必要なノード検索APIをページングがなくなるまで実行し結果を取得します。
   * 注意: ノード検索API関数の第一引数は検索オプション`StoragePaginationOptionsInput`
   *       であることを前提とします。
   *
   * @param func ノード検索API関数を指定
   * @param params ノード検索APIに渡す引数を指定
   */
  callStoragePaginationAPI<FUNC extends (...args: any[]) => Promise<StoragePaginationResult>>(
    func: FUNC,
    ...params: Parameters<FUNC>
  ): Promise<StorageNode[]>
}

//========================================================================
//
//  Value objects
//
//========================================================================

export enum StorageNodeType {
  File = 'File',
  Dir = 'Dir',
}

export interface AppConfigResponse {
  usersDir: string
}

export interface APIResponseStorageNode {
  id: string
  nodeType: StorageNodeType
  name: string
  dir: string
  path: string
  contentType: string
  size: number
  share: StorageNodeShareSettings
  created: string
  updated: string
}

export interface StorageNode extends Omit<APIResponseStorageNode, 'created' | 'updated'> {
  created: Dayjs
  updated: Dayjs
}

export interface StorageNodeShareSettings {
  isPublic?: boolean
  uids?: string[]
}

export interface StorageNodeShareSettingsInput extends StorageNodeShareSettings {}

export interface StoragePaginationOptionsInput {
  maxChunk?: number
  pageToken?: string
}

export interface APIResponseStoragePaginationResult {
  list: APIResponseStorageNode[]
  nextPageToken?: string
}

export interface StoragePaginationResult {
  list: StorageNode[]
  nextPageToken?: string
}
