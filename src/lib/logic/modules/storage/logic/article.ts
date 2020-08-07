import * as path from 'path'
import { CreateArticleDirInput, SetArticleSortOrderInput, StorageNode } from '../../../types'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from './base'
import { SubStorageLogic } from './sub'
import { config } from '@/lib/config'
import { store } from '../../../store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ArticleStorageLogic extends StorageLogic {
  createArticleDir(dirPath: string, input: CreateArticleDirInput): Promise<StorageNode>

  setArticleSortOrder(nodePath: string, input: SetArticleSortOrderInput): Promise<StorageNode>
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class ArticleStorageLogicImpl extends SubStorageLogic implements ArticleStorageLogic {
  get basePath(): string {
    return path.join(config.storage.users.dir, store.user.id, config.storage.articles.dir)
  }

  async createArticleDir(dirPath: string, input: CreateArticleDirInput): Promise<StorageNode> {
    const fullDirPath = StorageLogic.toFullNodePath(this.basePath, dirPath)
    return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.createArticleDirAPI(fullDirPath, input))
  }

  async setArticleSortOrder(nodePath: string, input: SetArticleSortOrderInput): Promise<StorageNode> {
    const fullNodePath = StorageLogic.toFullNodePath(this.basePath, nodePath)
    const fullInput: SetArticleSortOrderInput = {}
    if (input.insertBeforeNodePath) {
      fullInput.insertBeforeNodePath = StorageLogic.toFullNodePath(this.basePath, input.insertBeforeNodePath)
    } else if (input.insertAfterNodePath) {
      fullInput.insertAfterNodePath = StorageLogic.toFullNodePath(this.basePath, input.insertAfterNodePath)
    }
    return StorageLogic.toBasePathNode(this.basePath, await this.appStorage.setArticleSortOrderAPI(fullNodePath, fullInput))
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { ArticleStorageLogic, ArticleStorageLogicImpl }
