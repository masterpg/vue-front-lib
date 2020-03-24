import * as _path from 'path'
import { AppStorageLogic, UserStorageLogic } from '../../types'
import { AppStorageStore, UserStorageStore, store } from '../../store'
import { StorageNode, StorageNodeShareSettingsInput, api } from '../../api'
import { AppStorageUploadManager } from './app-upload'
import { BaseStorageLogic } from './base-storage-logic'
import { Component } from 'vue-property-decorator'
import { StorageUploadManager } from './base-upload'
import { UserStorageUploadManager } from './user-upload'
import { UserStorageUrlUploadManager } from './user-upload-by-url'
import { config } from '../../../config'
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
    return new UserStorageUploadManager(owner)
  }

  newUrlUploadManager(owner: Element): StorageUploadManager {
    return new UserStorageUrlUploadManager(owner)
  }

  protected getNodeAPI(nodePath: string): Promise<StorageNode | undefined> {
    return api.getUserStorageNode(nodePath)
  }

  protected getDirDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getUserStorageDirDescendants, null, dirPath)
  }

  protected getDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getUserStorageDescendants, null, dirPath)
  }

  protected getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getUserStorageDirChildren, null, dirPath)
  }

  protected getChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getUserStorageChildren, null, dirPath)
  }

  protected createDirsAPI(dirPaths: string[]): Promise<StorageNode[]> {
    return api.createUserStorageDirs(dirPaths)
  }

  protected removeDirsAPI(dirPaths: string[]): Promise<void> {
    return api.removeUserStorageDirs(dirPaths)
  }

  protected removeFilesAPI(filePaths: string[]): Promise<void> {
    return api.removeUserStorageFiles(filePaths)
  }

  protected moveDirAPI(fromDirPath: string, toDirPath: string): Promise<void> {
    return api.moveUserStorageDir(fromDirPath, toDirPath)
  }

  protected moveFileAPI(fromFilePath: string, toFilePath: string): Promise<void> {
    return api.moveUserStorageFile(fromFilePath, toFilePath)
  }

  protected renameDirAPI(dirPath: string, newName: string): Promise<void> {
    return api.renameUserStorageDir(dirPath, newName)
  }

  protected renameFileAPI(filePath: string, newName: string): Promise<void> {
    return api.renameUserStorageFile(filePath, newName)
  }

  protected setDirShareSettingsAPI(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setUserStorageDirShareSettings(dirPath, settings)
  }

  protected setFileShareSettingsAPI(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setUserStorageFileShareSettings(filePath, settings)
  }
}

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
    return new AppStorageUploadManager(owner)
  }

  protected getNodeAPI(nodePath: string): Promise<StorageNode | undefined> {
    return api.getStorageNode(nodePath)
  }

  protected getDirDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getStorageDirDescendants, null, dirPath)
  }

  protected getDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getStorageDescendants, null, dirPath)
  }

  protected getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getStorageDirChildren, null, dirPath)
  }

  protected getChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return this.getPaginationNodesAPI(api, api.getStorageChildren, null, dirPath)
  }

  protected createDirsAPI(dirPaths: string[]): Promise<StorageNode[]> {
    return api.createStorageDirs(dirPaths)
  }

  protected removeDirsAPI(dirPaths: string[]): Promise<void> {
    return api.removeStorageDirs(dirPaths)
  }

  protected removeFilesAPI(filePaths: string[]): Promise<void> {
    return api.removeStorageFiles(filePaths)
  }

  protected moveDirAPI(fromDirPath: string, toDirPath: string): Promise<void> {
    return api.moveStorageDir(fromDirPath, toDirPath)
  }

  protected moveFileAPI(fromFilePath: string, toFilePath: string): Promise<void> {
    return api.moveStorageFile(fromFilePath, toFilePath)
  }

  protected renameDirAPI(dirPath: string, newName: string): Promise<void> {
    return api.renameStorageDir(dirPath, newName)
  }

  protected renameFileAPI(filePath: string, newName: string): Promise<void> {
    return api.renameStorageFile(filePath, newName)
  }

  protected setDirShareSettingsAPI(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setStorageDirShareSettings(dirPath, settings)
  }

  protected setFileShareSettingsAPI(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setStorageFileShareSettings(filePath, settings)
  }
}

export { StorageUploadManager }
