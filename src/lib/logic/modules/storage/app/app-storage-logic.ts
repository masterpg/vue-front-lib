import { AppStorageStore, store } from '../../../store'
import { StorageNode, StorageNodeShareSettingsInput, api } from '../../../api'
import { AppStorageLogic } from '../../../types'
import { AppStorageUploadManager } from './app-upload'
import { BaseStorageLogic } from '../base/base-storage-logic'
import { Component } from 'vue-property-decorator'
import { StorageUploadManager } from '../types'
import { config } from '../../../../config'
import { removeEndSlash } from 'web-base-lib'

@Component
export class AppStorageLogicImpl extends BaseStorageLogic implements AppStorageLogic {
  protected get storageStore(): AppStorageStore {
    return store.appStorage
  }

  get baseURL(): string {
    const baseStorageURL = `${removeEndSlash(config.api.baseURL)}/storage`
    return `${baseStorageURL}`
  }

  newUploadManager(owner: Element): StorageUploadManager {
    return new AppStorageUploadManager(owner, this)
  }

  getNodeAPI(nodePath: string): Promise<StorageNode | undefined> {
    return api.getStorageNode(nodePath)
  }

  getDirDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getStorageDirDescendants, null, dirPath)
  }

  getDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getStorageDescendants, null, dirPath)
  }

  getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getStorageDirChildren, null, dirPath)
  }

  getChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getStorageChildren, null, dirPath)
  }

  createDirsAPI(dirPaths: string[]): Promise<StorageNode[]> {
    return api.createStorageDirs(dirPaths)
  }

  removeDirsAPI(dirPaths: string[]): Promise<void> {
    return api.removeStorageDirs(dirPaths)
  }

  removeFilesAPI(filePaths: string[]): Promise<void> {
    return api.removeStorageFiles(filePaths)
  }

  moveDirAPI(fromDirPath: string, toDirPath: string): Promise<void> {
    return api.moveStorageDir(fromDirPath, toDirPath)
  }

  moveFileAPI(fromFilePath: string, toFilePath: string): Promise<void> {
    return api.moveStorageFile(fromFilePath, toFilePath)
  }

  renameDirAPI(dirPath: string, newName: string): Promise<void> {
    return api.renameStorageDir(dirPath, newName)
  }

  renameFileAPI(filePath: string, newName: string): Promise<void> {
    return api.renameStorageFile(filePath, newName)
  }

  setDirShareSettingsAPI(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setStorageDirShareSettings(dirPath, settings)
  }

  setFileShareSettingsAPI(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setStorageFileShareSettings(filePath, settings)
  }
}
