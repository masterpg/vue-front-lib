import { CreateStorageNodeInput, RequiredStorageNodeShareSettings, StorageNode, StorageNodeShareSettingsInput } from '@/app/logic/types'
import { StorageDownloader, StorageFileDownloader, StorageFileDownloaderType } from '@/app/logic/modules/storage/download'
import { AppStorageLogic } from '@/app/logic/modules/storage/logic/app'
import { BaseLogic } from '@/app/logic/base'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from '@/app/logic/modules/storage/logic/base'
import { StorageUploader } from '@/app/logic/modules/storage/upload'
import { StorageUrlUploadManager } from '@/app/logic/modules/storage/upload-url'

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class SubStorageLogic extends BaseLogic implements StorageLogic {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  init(appStorage: AppStorageLogic) {
    this.appStorage = appStorage
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get basePath(): string {
    throw new Error('Not implemented.')
  }

  get nodes(): StorageNode[] {
    return StorageLogic.toBasePathNodes(this.basePath, this.appStorage.getDirDescendants(this.basePath))
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected appStorage: AppStorageLogic = {} as any

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getNode(key: { id?: string; path?: string }): StorageNode | undefined {
    if (key.path) {
      key.path = StorageLogic.toFullNodePath(this.basePath, key.path)
    }
    return StorageLogic.toBasePathNode(this.basePath, this.appStorage.getNode(key))
  }

  sgetNode(key: { id?: string; path?: string }): StorageNode {
    if (key.path) {
      key.path = StorageLogic.toFullNodePath(this.basePath, key.path)
    }
    return StorageLogic.toBasePathNode(this.basePath, this.appStorage.sgetNode(key))
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

  getInheritedShare(nodePath: string): RequiredStorageNodeShareSettings {
    nodePath = StorageLogic.toFullNodePath(this.basePath, nodePath)
    return this.appStorage.getInheritedShare(nodePath)
  }

  async fetchRoot(): Promise<void> {
    throw new Error('Not implemented.')
  }

  async fetchHierarchicalNodes(nodePath: string): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()
    nodePath = StorageLogic.toFullNodePath(this.basePath, nodePath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchHierarchicalNodes(nodePath))
  }

  async fetchAncestorDirs(nodePath: string): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()
    nodePath = StorageLogic.toFullNodePath(this.basePath, nodePath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchAncestorDirs(nodePath))
  }

  async fetchDirDescendants(dirPath?: string): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchDirDescendants(dirPath))
  }

  async fetchDescendants(dirPath?: string): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchDescendants(dirPath))
  }

  async fetchDirChildren(dirPath?: string): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchDirChildren(dirPath))
  }

  async fetchChildren(dirPath?: string): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchChildren(dirPath))
  }

  async fetchHierarchicalDescendants(dirPath?: string): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchHierarchicalDescendants(dirPath))
  }

  async fetchHierarchicalChildren(dirPath?: string): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.fetchHierarchicalChildren(dirPath))
  }

  async createDir(dirPath: string, input?: CreateStorageNodeInput): Promise<StorageNode> {
    this.appStorage.validateSignedIn()
    this.appStorage.validateSignedIn()
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.createDir(dirPath, input))
  }

  async createHierarchicalDirs(dirPaths: string[]): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()
    dirPaths = StorageLogic.toFullNodePaths(this.basePath, dirPaths)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.createHierarchicalDirs(dirPaths))
  }

  async removeDir(dirPath: string): Promise<void> {
    this.appStorage.validateSignedIn()
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    await this.appStorage.removeDir(dirPath)
  }

  async removeFile(filePath: string): Promise<void> {
    this.appStorage.validateSignedIn()
    filePath = StorageLogic.toFullNodePath(this.basePath, filePath)
    await this.appStorage.removeFile(filePath)
  }

  async moveDir(fromDirPath: string, toDirPath: string): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()
    fromDirPath = StorageLogic.toFullNodePath(this.basePath, fromDirPath)
    toDirPath = StorageLogic.toFullNodePath(this.basePath, toDirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.moveDir(fromDirPath, toDirPath))
  }

  async moveFile(fromFilePath: string, toFilePath: string): Promise<StorageNode> {
    this.appStorage.validateSignedIn()
    fromFilePath = StorageLogic.toFullNodePath(this.basePath, fromFilePath)
    toFilePath = StorageLogic.toFullNodePath(this.basePath, toFilePath)
    return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.moveFile(fromFilePath, toFilePath))
  }

  async renameDir(dirPath: string, newName: string): Promise<StorageNode[]> {
    this.appStorage.validateSignedIn()
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNodes(this.basePath, await this.appStorage.renameDir(dirPath, newName))
  }

  async renameFile(filePath: string, newName: string): Promise<StorageNode> {
    this.appStorage.validateSignedIn()
    filePath = StorageLogic.toFullNodePath(this.basePath, filePath)
    return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.renameFile(filePath, newName))
  }

  async setDirShareSettings(dirPath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode> {
    this.appStorage.validateSignedIn()
    dirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.setDirShareSettings(dirPath, input))
  }

  async setFileShareSettings(filePath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode> {
    this.appStorage.validateSignedIn()
    filePath = StorageLogic.toFullNodePath(this.basePath, filePath)
    return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.setFileShareSettings(filePath, input))
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

export { SubStorageLogic }
