import { APIStorageNode, AppConfigResponse, LibAPIContainer } from '../types'
import { BaseRESTClient } from './base'

export abstract class BaseRESTAPIContainer extends BaseRESTClient implements LibAPIContainer {
  async appConfig(): Promise<AppConfigResponse> {
    throw new Error(`This method 'appConfig' is not implemented.`)
  }

  async customToken(): Promise<string> {
    throw new Error(`This method 'customToken' is not implemented.`)
  }

  async userStorageDirNodes(dirPath?: string): Promise<APIStorageNode[]> {
    throw new Error(`This method 'userStorageDirNodes' is not implemented.`)
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    throw new Error(`This method 'createUserStorageDirs' is not implemented.`)
  }

  async removeUserStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    throw new Error(`This method 'removeUserStorageDir' is not implemented.`)
  }

  async removeUserStorageFiles(filePaths: string[]): Promise<APIStorageNode[]> {
    throw new Error(`This method 'removeUserStorageFiles' is not implemented.`)
  }

  async renameUserStorageDir(dirPath: string, newName: string): Promise<APIStorageNode[]> {
    throw new Error(`This method 'renameUserStorageDir' is not implemented.`)
  }

  async renameUserStorageFile(filePath: string, newName: string): Promise<APIStorageNode> {
    throw new Error(`This method 'renameUserStorageFile' is not implemented.`)
  }

  async getSignedUploadUrls(inputs: { filePath: string; contentType?: string }[]): Promise<string[]> {
    throw new Error(`This method 'getSignedUploadUrls' is not implemented.`)
  }

  moveUserStorageDir(fromDirPath: string, toDirPath: string): Promise<APIStorageNode[]> {
    throw new Error(`This method 'moveUserStorageDir' is not implemented.`)
  }

  moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode> {
    throw new Error(`This method 'moveUserStorageFile' is not implemented.`)
  }
}
