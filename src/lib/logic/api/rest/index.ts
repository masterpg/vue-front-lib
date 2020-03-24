import { AppConfigResponse, GetStorageOptionsInput, GetStorageResult, LibAPIContainer, StorageNode } from '../types'
import { BaseRESTClient } from './base'

export abstract class BaseRESTAPIContainer extends BaseRESTClient implements LibAPIContainer {
  async getAppConfig(): Promise<AppConfigResponse> {
    throw new Error(`This method 'getAppConfig' is not implemented.`)
  }

  async getCustomToken(): Promise<string> {
    throw new Error(`This method 'getCustomToken' is not implemented.`)
  }

  //--------------------------------------------------
  //  User storage
  //--------------------------------------------------

  getUserStorageNode(nodePath: string): Promise<StorageNode | undefined> {
    throw new Error(`This method 'getUserStorageNode' is not implemented.`)
  }

  getUserStorageDirDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    throw new Error(`This method 'getUserStorageDirDescendants' is not implemented.`)
  }

  getUserStorageDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    throw new Error(`This method 'getUserStorageDescendants' is not implemented.`)
  }

  getUserStorageDirChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    throw new Error(`This method 'getUserStorageDirChildren' is not implemented.`)
  }

  getUserStorageChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    throw new Error(`This method 'getUserStorageChildren' is not implemented.`)
  }

  async handleUploadedUserFiles(filePaths: string[]): Promise<void> {
    throw new Error(`This method 'handleUploadedUserFiles' is not implemented.`)
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    throw new Error(`This method 'createUserStorageDirs' is not implemented.`)
  }

  moveUserStorageDir(fromDirPath: string, toDirPath: string): Promise<void> {
    throw new Error(`This method 'moveUserStorageDir' is not implemented.`)
  }

  moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<void> {
    throw new Error(`This method 'moveUserStorageFile' is not implemented.`)
  }

  async removeUserStorageDirs(dirPaths: string[]): Promise<void> {
    throw new Error(`This method 'removeUserStorageDir' is not implemented.`)
  }

  async removeUserStorageFiles(filePaths: string[]): Promise<void> {
    throw new Error(`This method 'removeUserStorageFiles' is not implemented.`)
  }

  async renameUserStorageDir(dirPath: string, newName: string): Promise<void> {
    throw new Error(`This method 'renameUserStorageDir' is not implemented.`)
  }

  async renameUserStorageFile(filePath: string, newName: string): Promise<void> {
    throw new Error(`This method 'renameUserStorageFile' is not implemented.`)
  }

  setUserStorageDirShareSettings(dirPath: string, settings: import('../types').StorageNodeShareSettingsInput): Promise<StorageNode> {
    throw new Error(`This method 'setUserStorageDirShareSettings' is not implemented.`)
  }

  setUserStorageFileShareSettings(filePath: string, settings: import('../types').StorageNodeShareSettingsInput): Promise<StorageNode> {
    throw new Error(`This method 'setUserStorageFileShareSettings' is not implemented.`)
  }

  //--------------------------------------------------
  //  Application storage
  //--------------------------------------------------

  getStorageNode(nodePath: string): Promise<StorageNode | undefined> {
    throw new Error(`This method 'getStorageNode' is not implemented.`)
  }

  getStorageDirDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    throw new Error(`This method 'getStorageDirDescendants' is not implemented.`)
  }

  getStorageDescendants(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    throw new Error(`This method 'getStorageDescendants' is not implemented.`)
  }

  getStorageDirChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    throw new Error(`This method 'getStorageDirChildren' is not implemented.`)
  }

  getStorageChildren(options: GetStorageOptionsInput | null, dirPath?: string): Promise<GetStorageResult> {
    throw new Error(`This method 'getStorageChildren' is not implemented.`)
  }

  async handleUploadedFiles(filePaths: string[]): Promise<void> {
    throw new Error(`This method 'handleUploadedFiles' is not implemented.`)
  }

  async createStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    throw new Error(`This method 'createStorageDirs' is not implemented.`)
  }

  async removeStorageDirs(dirPaths: string[]): Promise<void> {
    throw new Error(`This method 'removeStorageDir' is not implemented.`)
  }

  async removeStorageFiles(filePaths: string[]): Promise<void> {
    throw new Error(`This method 'removeStorageFiles' is not implemented.`)
  }

  moveStorageDir(fromDirPath: string, toDirPath: string): Promise<void> {
    throw new Error(`This method 'moveStorageDir' is not implemented.`)
  }

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<void> {
    throw new Error(`This method 'moveStorageFile' is not implemented.`)
  }

  async renameStorageDir(dirPath: string, newName: string): Promise<void> {
    throw new Error(`This method 'renameStorageDir' is not implemented.`)
  }

  async renameStorageFile(filePath: string, newName: string): Promise<void> {
    throw new Error(`This method 'renameStorageFile' is not implemented.`)
  }

  setStorageDirShareSettings(dirPath: string, settings: import('../types').StorageNodeShareSettingsInput): Promise<StorageNode> {
    throw new Error(`This method 'setStorageDirShareSettings' is not implemented.`)
  }

  setStorageFileShareSettings(filePath: string, settings: import('../types').StorageNodeShareSettingsInput): Promise<StorageNode> {
    throw new Error(`This method 'setStorageFileShareSettings' is not implemented.`)
  }

  async getSignedUploadUrls(inputs: { filePath: string; contentType?: string }[]): Promise<string[]> {
    throw new Error(`This method 'getSignedUploadUrls' is not implemented.`)
  }
}
