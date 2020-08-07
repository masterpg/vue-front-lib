import {
  APIStorageNode,
  AppConfigResponse,
  AuthDataResult,
  LibAPIContainer,
  StoragePaginationInput,
  StoragePaginationResult,
  toTimestampEntities as _toTimestampEntities,
  toTimestampEntity as _toTimestampEntity,
} from '../base'
import {
  CreateArticleDirInput,
  CreateStorageNodeInput,
  SetArticleSortOrderInput,
  StorageNode,
  StorageNodeKeyInput,
  StorageNodeShareSettingsInput,
  UserInfo,
  UserInfoInput,
} from '../../types'
import { BaseRESTClient } from './base'

//========================================================================
//
//  Implementation
//
//========================================================================

abstract class BaseRESTAPIContainer extends BaseRESTClient implements LibAPIContainer {
  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async getAppConfig(): Promise<AppConfigResponse> {
    throw new Error(`This method 'getAppConfig' is not implemented.`)
  }

  //--------------------------------------------------
  //  User
  //--------------------------------------------------

  getAuthData(): Promise<AuthDataResult> {
    throw new Error(`This method 'getAuthData' is not implemented.`)
  }

  setOwnUserInfo(input: UserInfoInput): Promise<UserInfo> {
    throw new Error(`This method 'setOwnUserInfo' is not implemented.`)
  }

  deleteOwnUser(): Promise<boolean> {
    throw new Error(`This method 'deleteOwnUser' is not implemented.`)
  }

  //--------------------------------------------------
  //  Storage
  //--------------------------------------------------

  getStorageNode(input: StorageNodeKeyInput): Promise<APIStorageNode | undefined> {
    throw new Error(`This method 'getStorageNode' is not implemented.`)
  }

  getStorageDirDescendants(input: StoragePaginationInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getStorageDirDescendants' is not implemented.`)
  }

  getStorageDescendants(input: StoragePaginationInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getStorageDescendants' is not implemented.`)
  }

  getStorageDirChildren(input: StoragePaginationInput | null, dirPath?: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'getStorageDirChildren' is not implemented.`)
  }

  getStorageChildren(input: StoragePaginationInput | null, dirPath?: string): Promise<StoragePaginationResult> {
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

  createStorageDir(dirPath: string, input?: CreateStorageNodeInput): Promise<APIStorageNode> {
    throw new Error(`This method 'createStorageDir' is not implemented.`)
  }

  async createStorageHierarchicalDirs(dirPaths: string[]): Promise<StorageNode[]> {
    throw new Error(`This method 'createStorageHierarchicalDirs' is not implemented.`)
  }

  async removeStorageDir(input: StoragePaginationInput | null, dirPath: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'removeStorageDir' is not implemented.`)
  }

  async removeStorageFile(filePath: string): Promise<StorageNode | undefined> {
    throw new Error(`This method 'removeStorageFile' is not implemented.`)
  }

  moveStorageDir(input: StoragePaginationInput | null, fromDirPath: string, toDirPath: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'moveStorageDir' is not implemented.`)
  }

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    throw new Error(`This method 'moveStorageFile' is not implemented.`)
  }

  async renameStorageDir(input: StoragePaginationInput | null, dirPath: string, newName: string): Promise<StoragePaginationResult> {
    throw new Error(`This method 'renameStorageDir' is not implemented.`)
  }

  async renameStorageFile(filePath: string, newName: string): Promise<StorageNode> {
    throw new Error(`This method 'renameStorageFile' is not implemented.`)
  }

  setStorageDirShareSettings(dirPath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode> {
    throw new Error(`This method 'setStorageDirShareSettings' is not implemented.`)
  }

  setStorageFileShareSettings(filePath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode> {
    throw new Error(`This method 'setStorageFileShareSettings' is not implemented.`)
  }

  async getSignedUploadUrls(inputs: { filePath: string; contentType?: string }[]): Promise<string[]> {
    throw new Error(`This method 'getSignedUploadUrls' is not implemented.`)
  }

  //--------------------------------------------------
  //  Article
  //--------------------------------------------------

  createArticleDir(dirPath: string, input: CreateArticleDirInput): Promise<APIStorageNode> {
    throw new Error(`This method 'createArticleDir' is not implemented.`)
  }

  setArticleSortOrder(nodePath: string, input: SetArticleSortOrderInput): Promise<APIStorageNode> {
    throw new Error(`This method 'setArticleSortOrder' is not implemented.`)
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

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected readonly toTimestampEntity = _toTimestampEntity

  protected readonly toTimestampEntities = _toTimestampEntities
}

//========================================================================
//
//  Exports
//
//========================================================================

export { BaseRESTAPIContainer }
