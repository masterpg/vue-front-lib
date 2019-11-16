import { APIStorageNode, BaseAPIContainer } from '../types'
import { BaseRESTClient } from './base'

export abstract class BaseRESTAPIContainer extends BaseRESTClient implements BaseAPIContainer {
  async customToken(): Promise<string> {
    throw new Error('This method "customToken" is not implemented.')
  }

  async userStorageBasePath(): Promise<string> {
    throw new Error('This method "userStorageBasePath" is not implemented.')
  }

  async userStorageDirNodes(dirPath?: string): Promise<APIStorageNode[]> {
    throw new Error('This method "userStorageDirNodes" is not implemented.')
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    throw new Error('This method "createUserStorageDirs" is not implemented.')
  }

  async removeUserStorageFiles(filePaths: string[]): Promise<APIStorageNode[]> {
    throw new Error('This method "removeUserStorageFiles" is not implemented.')
  }

  async removeUserStorageDir(dirPath: string): Promise<APIStorageNode[]> {
    throw new Error('This method "removeUserStorageDir" is not implemented.')
  }

  async getSignedUploadUrls(inputs: { filePath: string; contentType?: string }[]): Promise<string[]> {
    throw new Error('This method "getSignedUploadUrls" is not implemented.')
  }
}
