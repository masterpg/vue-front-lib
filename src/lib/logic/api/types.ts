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

export interface APIStorageNode {
  nodeType: APIStorageNodeType
  name: string
  dir: string
  path: string
}

export enum APIStorageNodeType {
  File = 'File',
  Dir = 'Dir',
}
