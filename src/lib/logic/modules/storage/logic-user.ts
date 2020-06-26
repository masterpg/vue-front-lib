import * as path from 'path'
import { StorageDownloader, StorageFileDownloader, StorageFileDownloaderType } from './download'
import { StorageNode, StorageNodeShareSettingsInput } from '../../api'
import { BaseLogic } from '../../base'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from './logic'
import { StorageUploader } from './upload'
import { StorageUrlUploadManager } from './upload-url'
import { config } from '@/lib/config'
import { store } from '../../store'

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class UserStorageLogic extends BaseLogic implements StorageLogic {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  init(appStorage: StorageLogic) {
    this.appStorage = appStorage
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected appStorage: StorageLogic = {} as any

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  get baseURL(): string {
    return this.appStorage.baseURL
  }

  get basePath(): string {
    return path.join(config.storage.usersDir, store.user.id)
  }

  get nodes(): StorageNode[] {
    return StorageLogic.toBasePathNodes(this.basePath, this.appStorage.getDirDescendants(this.basePath))
  }

  getNode(key: { id?: string; path?: string }): StorageNode | undefined {
    if (key.path) {
      key.path = StorageLogic.toFullNodePath(this.basePath, key.path)
    }
    return StorageLogic.toBasePathNode(this.basePath, this.appStorage.getNode(key))
  }

  getDescendants(dirPath?: string): StorageNode[] {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, this.appStorage.getDescendants(dirPath))
  }

  getDirDescendants(dirPath: string): StorageNode[] {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, this.appStorage.getDirDescendants(dirPath))
  }

  getChildren(dirPath?: string): StorageNode[] {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, this.appStorage.getChildren(dirPath))
  }

  getDirChildren(dirPath: string): StorageNode[] {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, this.appStorage.getDirChildren(dirPath))
  }

  getHierarchicalNodes(nodePath: string): StorageNode[] {
    nodePath = StorageLogic.toFullNodePath(this.basePath, nodePath)
    return StorageLogic.toBasePathNodes(this.basePath, this.appStorage.getHierarchicalNodes(nodePath))
  }

  async fetchHierarchicalNodes(nodePath: string): Promise<StorageNode[]> {
    nodePath = StorageLogic.toFullNodePath(this.basePath, nodePath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchHierarchicalNodes(nodePath))
  }

  async fetchAncestorDirs(nodePath: string): Promise<StorageNode[]> {
    nodePath = StorageLogic.toFullNodePath(this.basePath, nodePath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchAncestorDirs(nodePath))
  }

  async fetchDirDescendants(dirPath?: string): Promise<StorageNode[]> {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchDirDescendants(dirPath))
  }

  async fetchDescendants(dirPath?: string): Promise<StorageNode[]> {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchDescendants(dirPath))
  }

  async fetchDirChildren(dirPath?: string): Promise<StorageNode[]> {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchDirChildren(dirPath))
  }

  async fetchChildren(dirPath?: string): Promise<StorageNode[]> {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchChildren(dirPath))
  }

  async fetchHierarchicalDescendants(dirPath?: string): Promise<StorageNode[]> {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchHierarchicalDescendants(dirPath))
  }

  async fetchHierarchicalChildren(dirPath?: string): Promise<StorageNode[]> {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchHierarchicalChildren(dirPath))
  }

  async createDirs(dirPaths: string[]): Promise<StorageNode[]> {
    dirPaths = StorageLogic.toFullNodePaths(this.basePath, dirPaths)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.createDirs(dirPaths))
  }

  async removeDir(dirPath: string): Promise<void> {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    await this.appStorage.removeDir(dirPath)
  }

  async removeFile(filePath: string): Promise<void> {
    filePath = StorageLogic.toFullNodePath(this.basePath, filePath)
    await this.appStorage.removeFile(filePath)
  }

  async moveDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    fromDirPath = StorageLogic.toFullNodePath(this.basePath, fromDirPath)
    toDirPath = StorageLogic.toFullNodePath(this.basePath, toDirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.moveDir(fromDirPath, toDirPath))
  }

  async moveFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    fromFilePath = StorageLogic.toFullNodePath(this.basePath, fromFilePath)
    toFilePath = StorageLogic.toFullNodePath(this.basePath, toFilePath)
    return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.moveFile(fromFilePath, toFilePath))
  }

  async renameDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.renameDir(dirPath, newName))
  }

  async renameFile(filePath: string, newName: string): Promise<StorageNode> {
    filePath = StorageLogic.toFullNodePath(this.basePath, filePath)
    return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.renameFile(filePath, newName))
  }

  async setDirShareSettings(dirPath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.setDirShareSettings(dirPath, settings))
  }

  async setFileShareSettings(filePath: string, settings: StorageNodeShareSettingsInput): Promise<StorageNode> {
    filePath = StorageLogic.toFullNodePath(this.basePath, filePath)
    return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.setFileShareSettings(filePath, settings))
  }

  newUploader(owner: Element): StorageUploader {
    return new StorageUploader(this, owner)
  }

  newUrlUploader(owner: Element): StorageUploader {
    return new StorageUrlUploadManager(this, owner)
  }

  newDownloader(): StorageDownloader {
    return new StorageDownloader(this)
  }

  newFileDownloader(type: StorageFileDownloaderType, filePath: string): StorageFileDownloader {
    return StorageFileDownloader.newInstance(this, type, filePath)
  }

  handleUploadedFileAPI(filePath: string): Promise<StorageNode> {
    filePath = StorageLogic.toFullNodePath(this.basePath, filePath)
    return this.appStorage.handleUploadedFileAPI(filePath)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { UserStorageLogic }
