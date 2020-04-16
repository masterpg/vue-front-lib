import { AppConfigResponse, LibAPIContainer, StorageNode, StoragePaginationOptionsInput, StoragePaginationResult } from '../types'
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

  getUserStorageDirDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getUserStorageDirDescendants' is not implemented.`)
  }

  getUserStorageDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getUserStorageDescendants' is not implemented.`)
  }

  getUserStorageDirChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getUserStorageDirChildren' is not implemented.`)
  }

  getUserStorageChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getUserStorageChildren' is not implemented.`)
  }

  getUserStorageHierarchicalNodes(nodePath: string): Promise<StorageNode[]> {
    throw new Error(`This method 'getUserStorageHierarchicalNodes' is not implemented.`)
  }

  getUserStorageAncestorDirs(nodePath: string): Promise<StorageNode[]> {
    throw new Error(`This method 'getUserStorageAncestorDirs' is not implemented.`)
  }

  async handleUploadedUserFile(filePath: string): Promise<StorageNode> {
    throw new Error(`This method 'handleUploadedUserFile' is not implemented.`)
  }

  async createUserStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    throw new Error(`This method 'createUserStorageDirs' is not implemented.`)
  }

  moveUserStorageDir(options: StoragePaginationOptionsInput | null, fromDirPath: string, toDirPath: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'moveUserStorageDir' is not implemented.`)
  }

  moveUserStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    throw new Error(`This method 'moveUserStorageFile' is not implemented.`)
  }

  async removeUserStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'removeUserStorageDir' is not implemented.`)
  }

  async removeUserStorageFile(filePath: string): Promise<StorageNode | undefined> {
    throw new Error(`This method 'removeUserStorageFile' is not implemented.`)
  }

  async renameUserStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string, newName: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'renameUserStorageDir' is not implemented.`)
  }

  async renameUserStorageFile(filePath: string, newName: string): Promise<StorageNode> {
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

  getStorageDirDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getStorageDirDescendants' is not implemented.`)
  }

  getStorageDescendants(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getStorageDescendants' is not implemented.`)
  }

  getStorageDirChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getStorageDirChildren' is not implemented.`)
  }

  getStorageChildren(options: StoragePaginationOptionsInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getStorageChildren' is not implemented.`)
  }

  getStorageHierarchicalNodes(nodePath: string): Promise<StorageNode[]> {
    throw new Error(`This method 'getStorageHierarchicalNodes' is not implemented.`)
  }

  getStorageAncestorDirs(nodePath: string): Promise<StorageNode[]> {
    throw new Error(`This method 'getStorageAncestorDirs' is not implemented.`)
  }

  async handleUploadedFile(filePath: string): Promise<StorageNode> {
    throw new Error(`This method 'handleUploadedFile' is not implemented.`)
  }

  async createStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    throw new Error(`This method 'createStorageDirs' is not implemented.`)
  }

  async removeStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'removeStorageDir' is not implemented.`)
  }

  async removeStorageFile(filePath: string): Promise<StorageNode | undefined> {
    throw new Error(`This method 'removeStorageFile' is not implemented.`)
  }

  moveStorageDir(options: StoragePaginationOptionsInput | null, fromDirPath: string, toDirPath: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'moveStorageDir' is not implemented.`)
  }

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    throw new Error(`This method 'moveStorageFile' is not implemented.`)
  }

  async renameStorageDir(options: StoragePaginationOptionsInput | null, dirPath: string, newName: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'renameStorageDir' is not implemented.`)
  }

  async renameStorageFile(filePath: string, newName: string): Promise<StorageNode> {
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

  //--------------------------------------------------
  //  Helpers
  //--------------------------------------------------

  // eslint-disable-next-line space-before-function-paren
  async callStoragePaginationAPI<FUNC extends (...args: any[]) => Promise<StoragePaginationResult>>(
    func: FUNC,
    ...params: Parameters<FUNC>
  ): Promise<StorageNode[]> {
    throw new Error(`This method 'callStoragePaginationAPI' is not implemented.`)
  }
}
