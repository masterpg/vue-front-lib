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
    return this.getPaginationNodesAPI(api, api.getUserStorageDirDescendants, null, dirPath)
  }

  getDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getUserStorageDescendants, null, dirPath)
  }

  getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getUserStorageDirChildren, null, dirPath)
  }

  getChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getUserStorageChildren, null, dirPath)
  }

  getHierarchicalNodeAPI(nodePath: string): Promise<StorageNode[]> {
    return api.getUserStorageHierarchicalNode(nodePath)
  }

  getAncestorDirsAPI(nodePath: string): Promise<StorageNode[]> {
    return api.getUserStorageAncestorDirs(nodePath)
  }

  handleUploadedFilesAPI(filePaths: string[]): Promise<void> {
    return api.handleUploadedUserFiles(filePaths)
  }

  createDirsAPI(dirPaths: string[]): Promise<StorageNode[]> {
    return api.createUserStorageDirs(dirPaths)
  }

  removeDirsAPI(dirPaths: string[]): Promise<void> {
    return api.removeUserStorageDirs(dirPaths)
  }

  removeFilesAPI(filePaths: string[]): Promise<void> {
    return api.removeUserStorageFiles(filePaths)
  }

  moveDirAPI(fromDirPath: string, toDirPath: string): Promise<void> {
    return api.moveUserStorageDir(fromDirPath, toDirPath)
  }

  moveFileAPI(fromFilePath: string, toFilePath: string): Promise<void> {
    return api.moveUserStorageFile(fromFilePath, toFilePath)
  }

  renameDirAPI(dirPath: string, newName: string): Promise<void> {
    return api.renameUserStorageDir(dirPath, newName)
  }

  renameFileAPI(filePath: string, newName: string): Promise<void> {
    return api.renameUserStorageFile(filePath, newName)
  }

  setDirShareSettingsAPI(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setUserStorageDirShareSettings(dirPath, settings)
  }

  setFileShareSettingsAPI(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setUserStorageFileShareSettings(filePath, settings)
  }
}
