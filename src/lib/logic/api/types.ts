import { Dayjs } from 'dayjs'

//========================================================================
//
//  API
//
//========================================================================

export interface LibAPIContainer {
  getAppConfig(): Promise<AppConfigResponse>

  getCustomToken(): Promise<string>

  getHierarchicalUserStorageDescendants(dirPath?: string): Promise<StorageNode[]>

  getHierarchicalUserStorageChildren(dirPath?: string): Promise<StorageNode[]>

  getUserStorageChildren(dirPath?: string): Promise<StorageNode[]>

  handleUploadedUserFiles(filePaths: string[]): Promise<StorageNode[]>

  createUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeUserStorageFiles(filePaths: string[]): Promise<StorageNode[]>

  moveUserStorageDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]>

  moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode>

  renameUserStorageDir(dirPath: string, newName: string): Promise<StorageNode[]>

  renameUserStorageFile(filePath: string, newName: string): Promise<StorageNode>

  setUserStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  setUserStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  getHierarchicalStorageDescendants(dirPath?: string): Promise<StorageNode[]>

  getHierarchicalStorageChildren(dirPath?: string): Promise<StorageNode[]>

  getStorageChildren(dirPath?: string): Promise<StorageNode[]>

  handleUploadedFiles(filePaths: string[]): Promise<StorageNode[]>

  createStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeStorageDirs(dirPaths: string[]): Promise<StorageNode[]>

  removeStorageFiles(filePaths: string[]): Promise<StorageNode[]>

  moveStorageDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]>

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode>

  renameStorageDir(dirPath: string, newName: string): Promise<StorageNode[]>

  renameStorageFile(filePath: string, newName: string): Promise<StorageNode>

  getSignedUploadUrls(params: { filePath: string; contentType?: string }[]): Promise<string[]>

  setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>

  setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode>
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
