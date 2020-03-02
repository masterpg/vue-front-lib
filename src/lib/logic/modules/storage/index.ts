import * as _path from 'path'
import { AppStorageLogic, UserStorageLogic } from '../../types'
import { AppStorageStore, UserStorageStore, store } from '../../store'
import { StorageNode, StorageNodeShareSettingsInput, api } from '../../api'
import { AppStorageUploadManager } from './app-upload'
import { BaseStorageLogic } from './base-storage'
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

  protected getHierarchicalStorageDescendants(dirPath?: string): Promise<StorageNode[]> {
    return api.getHierarchicalUserStorageDescendants(dirPath)
  }

  protected getHierarchicalStorageChildren(dirPath?: string): Promise<StorageNode[]> {
    return api.getHierarchicalUserStorageChildren(dirPath)
  }

  protected getStorageChildren(dirPath?: string): Promise<StorageNode[]> {
    return api.getUserStorageChildren(dirPath)
  }

  protected createStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    return api.createUserStorageDirs(dirPaths)
  }

  protected removeStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    return api.removeUserStorageDirs(dirPaths)
  }

  protected removeStorageFiles(filePaths: string[]): Promise<StorageNode[]> {
    return api.removeUserStorageFiles(filePaths)
  }

  protected moveStorageDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    return api.moveUserStorageDir(fromDirPath, toDirPath)
  }

  protected moveStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    return api.moveUserStorageFile(fromFilePath, toFilePath)
  }

  protected renameStorageDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    return api.renameUserStorageDir(dirPath, newName)
  }

  protected renameStorageFile(filePath: string, newName: string): Promise<StorageNode> {
    return api.renameUserStorageFile(filePath, newName)
  }

  protected setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode[]> {
    return api.setUserStorageDirShareSettings(dirPath, settings)
  }

  protected setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
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

  protected getHierarchicalStorageDescendants(dirPath?: string): Promise<StorageNode[]> {
    return api.getHierarchicalStorageDescendants(dirPath)
  }

  protected getHierarchicalStorageChildren(dirPath?: string): Promise<StorageNode[]> {
    return api.getHierarchicalStorageChildren(dirPath)
  }

  protected getStorageChildren(dirPath?: string): Promise<StorageNode[]> {
    return api.getStorageChildren(dirPath)
  }

  protected createStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    return api.createStorageDirs(dirPaths)
  }

  protected removeStorageDirs(dirPaths: string[]): Promise<StorageNode[]> {
    return api.removeStorageDirs(dirPaths)
  }

  protected removeStorageFiles(filePaths: string[]): Promise<StorageNode[]> {
    return api.removeStorageFiles(filePaths)
  }

  protected moveStorageDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    return api.moveStorageDir(fromDirPath, toDirPath)
  }

  protected moveStorageFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    return api.moveStorageFile(fromFilePath, toFilePath)
  }

  protected renameStorageDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    return api.renameStorageDir(dirPath, newName)
  }

  protected renameStorageFile(filePath: string, newName: string): Promise<StorageNode> {
    return api.renameStorageFile(filePath, newName)
  }

  protected setStorageDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode[]> {
    return api.setStorageDirShareSettings(dirPath, settings)
  }

  protected setStorageFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setStorageFileShareSettings(filePath, settings)
  }
}

export { StorageUploadManager }
