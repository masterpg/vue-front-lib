import { APIStorageNode, AppConfigResponse, LibAPIContainer } from '../types'
import { BaseRESTClient } from './base'

export abstract class BaseRESTAPIContainer extends BaseRESTClient implements LibAPIContainer {
  async appConfig(): Promise<AppConfigResponse> {
    throw new Error(`This method 'appConfig' is not implemented.`)
  }

  async customToken(): Promise<string> {
    throw new Error(`This method 'customToken' is not implemented.`)
  }

  async getSignedUploadUrls(inputs: { filePath: string; contentType?: string }[]): Promise<string[]> {
    throw new Error(`This method 'getSignedUploadUrls' is not implemented.`)
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

  moveUserStorageDir(fromDirPath: string, toDirPath: string): Promise<APIStorageNode[]> {
    throw new Error(`This method 'moveUserStorageDir' is not implemented.`)
  }

  moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode> {
    throw new Error(`This method 'moveUserStorageFile' is not implemented.`)
  }

  async storageDirNodes(dirPath?: string): Promise<APIStorageNode[]> {
    throw new Error(`This method 'storageDirNodes' is not implemented.`)
  }

  async createStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    throw new Error(`This method 'createStorageDirs' is not implemented.`)
  }

  async removeStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    throw new Error(`This method 'removeStorageDir' is not implemented.`)
  }

  async removeStorageFiles(filePaths: string[]): Promise<APIStorageNode[]> {
    throw new Error(`This method 'removeStorageFiles' is not implemented.`)
  }

  async renameStorageDir(dirPath: string, newName: string): Promise<APIStorageNode[]> {
    throw new Error(`This method 'renameStorageDir' is not implemented.`)
  }

  async renameStorageFile(filePath: string, newName: string): Promise<APIStorageNode> {
    throw new Error(`This method 'renameStorageFile' is not implemented.`)
  }

  moveStorageDir(fromDirPath: string, toDirPath: string): Promise<APIStorageNode[]> {
    throw new Error(`This method 'moveStorageDir' is not implemented.`)
  }

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode> {
    throw new Error(`This method 'moveStorageFile' is not implemented.`)
  }
}
