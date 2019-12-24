import { APIStorageNode, api } from '../../api'
import { AppStorageLogic, UserStorageLogic } from '../../types'
import { AppStorageStore, UserStorageStore, store } from '../../store'
import { AppStorageUploadManager } from './app-upload'
import { BaseStorageLogic } from './base-storage'
import { Component } from 'vue-property-decorator'
import { StorageUploadManager } from './base-upload'
import { UserStorageUploadManager } from './user-upload'
import { UserStorageUrlUploadManager } from './user-upload-by-url'

@Component
export class UserStorageLogicImpl extends BaseStorageLogic implements UserStorageLogic {
  protected get storageStore(): UserStorageStore {
    return store.userStorage
  }

  newUploadManager(owner: Element): StorageUploadManager {
    return new UserStorageUploadManager(owner)
  }

  newUrlUploadManager(owner: Element): StorageUploadManager {
    return new UserStorageUrlUploadManager(owner)
  }

  protected storageDirNodes(dirPath?: string): Promise<APIStorageNode[]> {
    return api.userStorageDirNodes(dirPath)
  }

  protected createStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    return api.createUserStorageDirs(dirPaths)
  }

  protected removeStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    return api.removeUserStorageDirs(dirPaths)
  }

  protected removeStorageFiles(filePaths: string[]): Promise<APIStorageNode[]> {
    return api.removeUserStorageFiles(filePaths)
  }

  protected moveStorageDir(fromDirPath: string, toDirPath: string): Promise<APIStorageNode[]> {
    return api.moveUserStorageDir(fromDirPath, toDirPath)
  }

  protected moveStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode> {
    return api.moveUserStorageFile(fromFilePath, toFilePath)
  }

  protected renameStorageDir(dirPath: string, newName: string): Promise<APIStorageNode[]> {
    return api.renameUserStorageDir(dirPath, newName)
  }

  protected renameStorageFile(filePath: string, newName: string): Promise<APIStorageNode> {
    return api.renameUserStorageFile(filePath, newName)
  }
}

@Component
export class AppStorageLogicImpl extends BaseStorageLogic implements AppStorageLogic {
  protected get storageStore(): AppStorageStore {
    return store.appStorage
  }

  newUploadManager(owner: Element): StorageUploadManager {
    return new AppStorageUploadManager(owner)
  }

  protected storageDirNodes(dirPath?: string): Promise<APIStorageNode[]> {
    return api.storageDirNodes(dirPath)
  }

  protected createStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    return api.createStorageDirs(dirPaths)
  }

  protected removeStorageDirs(dirPaths: string[]): Promise<APIStorageNode[]> {
    return api.removeStorageDirs(dirPaths)
  }

  protected removeStorageFiles(filePaths: string[]): Promise<APIStorageNode[]> {
    return api.removeStorageFiles(filePaths)
  }

  protected moveStorageDir(fromDirPath: string, toDirPath: string): Promise<APIStorageNode[]> {
    return api.moveStorageDir(fromDirPath, toDirPath)
  }

  protected moveStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode> {
    return api.moveStorageFile(fromFilePath, toFilePath)
  }

  protected renameStorageDir(dirPath: string, newName: string): Promise<APIStorageNode[]> {
    return api.renameStorageDir(dirPath, newName)
  }

  protected renameStorageFile(filePath: string, newName: string): Promise<APIStorageNode> {
    return api.renameStorageFile(filePath, newName)
  }
}

export { StorageUploadManager }
