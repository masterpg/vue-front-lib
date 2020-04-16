import * as _path from 'path'
import { StorageNode, StorageNodeShareSettingsInput, api } from '../../../api'
import { UserStorageStore, store } from '../../../store'
import { BaseStorageLogic } from '../base/base-storage-logic'
import { Component } from 'vue-property-decorator'
import { StorageUploadManager } from '../types'
import { UserStorageLogic } from '../../../types'
import { UserStorageUploadManager } from './user-upload'
import { UserStorageUrlUploadManager } from './user-upload-by-url'
import { config } from '../../../../config'
import { removeEndSlash } from 'web-base-lib'

@Component
export class UserStorageLogicImpl extends BaseStorageLogic implements UserStorageLogic {
  protected get storageStore(): UserStorageStore {
    return store.userStorage
  }

  get baseURL(): string {
    const baseStorageURL = `${removeEndSlash(config.api.baseURL)}/storage`
    return `${baseStorageURL}/${_path.join(config.storage.usersDir, store.user.myDirName)}`
  }

  newUploadManager(owner: Element): StorageUploadManager {
    return new UserStorageUploadManager(owner, this)
  }

  newUrlUploadManager(owner: Element): StorageUploadManager {
    return new UserStorageUrlUploadManager(owner, this)
  }

  getNodeAPI(nodePath: string): Promise<StorageNode | undefined> {
    return api.getUserStorageNode(nodePath)
  }

  getDirDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getUserStorageDirDescendants, null, dirPath)
  }

  getDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getUserStorageDescendants, null, dirPath)
  }

  getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getUserStorageDirChildren, null, dirPath)
  }

  getChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getUserStorageChildren, null, dirPath)
  }

  getHierarchicalNodesAPI(nodePath: string): Promise<StorageNode[]> {
    return api.getUserStorageHierarchicalNodes(nodePath)
  }

  getAncestorDirsAPI(nodePath: string): Promise<StorageNode[]> {
    return api.getUserStorageAncestorDirs(nodePath)
  }

  handleUploadedFileAPI(filePath: string): Promise<StorageNode> {
    return api.handleUploadedUserFile(filePath)
  }

  createDirsAPI(dirPaths: string[]): Promise<StorageNode[]> {
    return api.createUserStorageDirs(dirPaths)
  }

  removeDirAPI(dirPath: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.removeUserStorageDir, null, dirPath)
  }

  removeFileAPI(filePath: string): Promise<StorageNode | undefined> {
    return api.removeUserStorageFile(filePath)
  }

  moveDirAPI(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.moveUserStorageDir, null, fromDirPath, toDirPath)
  }

  moveFileAPI(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    return api.moveUserStorageFile(fromFilePath, toFilePath)
  }

  renameDirAPI(dirPath: string, newName: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.renameUserStorageDir, null, dirPath, newName)
  }

  renameFileAPI(filePath: string, newName: string): Promise<StorageNode> {
    return api.renameUserStorageFile(filePath, newName)
  }

  setDirShareSettingsAPI(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setUserStorageDirShareSettings(dirPath, settings)
  }

  setFileShareSettingsAPI(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setUserStorageFileShareSettings(filePath, settings)
  }
}
