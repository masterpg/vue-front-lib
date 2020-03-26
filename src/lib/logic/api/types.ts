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

  getUserStorageDirDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult>

  getUserStorageDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult>

  getUserStorageDirChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult>

  getUserStorageChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult>

  getUserStorageHierarchicalNode(nodePath: string): Promise<StorageNode[]>

  getUserStorageAncestorDirs(nodePath: string): Promise<StorageNode[]>

  handleUploadedUserFiles(filePaths: string[]): Promise<void>

  createUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeUserStorageDirs(dirPaths: string[]): Promise<void>

  removeUserStorageFiles(filePaths: string[]): Promise<void>

  moveUserStorageDir(fromDirPath: string, toDirPath: string): Promise<void>

  moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<void>

  renameUserStorageDir(dirPath: string, newName: string): Promise<void>

  renameUserStorageFile(filePath: string, newName: string): Promise<void>

  setUserStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  setUserStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  //--------------------------------------------------
  //  Application storage
  //--------------------------------------------------

  getStorageNode(nodePath: string): Promise<StorageNode | undefined>

  getStorageDirDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult>

  getStorageDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult>

  getStorageDirChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult>

  getStorageChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult>

  getStorageHierarchicalNode(nodePath: string): Promise<StorageNode[]>

  getStorageAncestorDirs(nodePath: string): Promise<StorageNode[]>

  handleUploadedFiles(filePaths: string[]): Promise<void>

  createStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeStorageDirs(dirPaths: string[]): Promise<void>

  removeStorageFiles(filePaths: string[]): Promise<void>

  moveStorageDir(fromDirPath: string, toDirPath: string): Promise<void>

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<void>

  renameStorageDir(dirPath: string, newName: string): Promise<void>

  renameStorageFile(filePath: string, newName: string): Promise<void>

  setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  getSignedUploadUrls(params: { filePath: string; contentType?: string }[]): Promise<string[]>
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

export interface GetStorageOptionsInput {
  maxResults?: number
  pageToken?: string
}

export interface APIResponseGetStorageResult {
  list: APIResponseStorageNode[]
  nextPageToken?: string
}

export interface GetStorageResult {
  list: StorageNode[]
  nextPageToken?: string
}
