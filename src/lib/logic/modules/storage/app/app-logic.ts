import { AppStorageLogic, BaseStorageLogic } from '../logic'
import { AppStorageStore, store } from '../../../store'
import { StorageNode, StorageNodeShareSettingsInput, api } from '../../../api'
import { AppStorageUploader } from './app-upload'
import { Component } from 'vue-property-decorator'
import { StorageUploader } from '../upload'
import { config } from '../../../../config'
import { removeEndSlash } from 'web-base-lib'

@Component
export class AppStorageLogicImpl extends BaseStorageLogic implements AppStorageLogic {
  protected get storageStore(): AppStorageStore {
    return store.appStorage
  }

  get basePath(): string {
    return ''
  }

  get baseURL(): string {
    const baseStorageURL = `${removeEndSlash(config.api.baseURL)}/storage`
    return `${baseStorageURL}`
  }

  newUploader(owner: Element): StorageUploader {
    return new AppStorageUploader(owner, this)
  }

  getNodeAPI(nodePath: string): Promise<StorageNode | undefined> {
    return api.getStorageNode(nodePath)
  }

  getDirDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getStorageDirDescendants, null, dirPath)
  }

  getDescendantsAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getStorageDescendants, null, dirPath)
  }

  getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getStorageDirChildren, null, dirPath)
  }

  getChildrenAPI(dirPath?: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.getStorageChildren, null, dirPath)
  }

  getHierarchicalNodesAPI(nodePath: string): Promise<StorageNode[]> {
    return api.getStorageHierarchicalNodes(nodePath)
  }

  getAncestorDirsAPI(nodePath: string): Promise<StorageNode[]> {
    return api.getStorageAncestorDirs(nodePath)
  }

  handleUploadedFileAPI(filePath: string): Promise<StorageNode> {
    return api.handleUploadedFile(filePath)
  }

  createDirsAPI(dirPaths: string[]): Promise<StorageNode[]> {
    return api.createStorageDirs(dirPaths)
  }

  removeDirAPI(dirPath: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.removeStorageDir, null, dirPath)
  }

  removeFileAPI(filePath: string): Promise<StorageNode | undefined> {
    return api.removeStorageFile(filePath)
  }

  moveDirAPI(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.moveStorageDir, null, fromDirPath, toDirPath)
  }

  moveFileAPI(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    return api.moveStorageFile(fromFilePath, toFilePath)
  }

  renameDirAPI(dirPath: string, newName: string): Promise<StorageNode[]> {
    return api.callStoragePaginationAPI(api.renameStorageDir, null, dirPath, newName)
  }

  renameFileAPI(filePath: string, newName: string): Promise<StorageNode> {
    return api.renameStorageFile(filePath, newName)
  }

  setDirShareSettingsAPI(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setStorageDirShareSettings(dirPath, settings)
  }

  setFileShareSettingsAPI(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    return api.setStorageFileShareSettings(filePath, settings)
  }
}
