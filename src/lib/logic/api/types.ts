import { Dayjs } from 'dayjs'

//========================================================================
//
//  API
//
//========================================================================

export interface LibAPIContainer {
  appConfig(): Promise<AppConfigResponse>

  customToken(): Promise<string>

  userStorageDirNodes(dirPath?: string): Promise<APIStorageNode[]>

  createUserStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]>

  removeUserStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]>

  removeUserStorageFiles(filePaths: string[]): Promise<APIStorageNode[]>

  moveUserStorageDir(fromDirPath: string, toDirPath: string): Promise<APIStorageNode[]>

  moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode>

  renameUserStorageDir(dirPath: string, newName: string): Promise<APIStorageNode[]>

  renameUserStorageFile(filePath: string, newName: string): Promise<APIStorageNode>

  storageDirNodes(dirPath?: string): Promise<APIStorageNode[]>

  createStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]>

  removeStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]>

  removeStorageFiles(filePaths: string[]): Promise<APIStorageNode[]>

  moveStorageDir(fromDirPath: string, toDirPath: string): Promise<APIStorageNode[]>

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode>

  renameStorageDir(dirPath: string, newName: string): Promise<APIStorageNode[]>

  renameStorageFile(filePath: string, newName: string): Promise<APIStorageNode>

  getSignedUploadUrls(params: { filePath: string; contentType?: string }[]): Promise<string[]>
}

//========================================================================
//
//  Value objects
//
//========================================================================

export interface AppConfigResponse {
  usersDir: string
}

export interface APIResponseStorageNode {
  nodeType: APIStorageNodeType
  name: string
  dir: string
  path: string
  created: string
  updated: string
}

export interface APIStorageNode {
  nodeType: APIStorageNodeType
  name: string
  dir: string
  path: string
  created: Dayjs
  updated: Dayjs
}

export enum APIStorageNodeType {
  File = 'File',
  Dir = 'Dir',
}
