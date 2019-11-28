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

  removeUserStorageFiles(filePaths: string[]): Promise<APIStorageNode[]>

  removeUserStorageDir(dirPath: string): Promise<APIStorageNode[]>

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
