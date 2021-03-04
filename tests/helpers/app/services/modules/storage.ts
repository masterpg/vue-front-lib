import { DeepPartial, removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import { StorageArticleSettings, StorageHelper, StorageNode } from '@/app/services'
import { TestServiceContainer } from '../index'
import _path from 'path'
import dayjs from 'dayjs'
import { merge } from 'lodash'
const { EmptyShareSettings } = StorageHelper

//========================================================================
//
//  Interfaces
//
//========================================================================

type NewTestStorageNodeData = DeepPartial<Omit<StorageNode, 'name' | 'dir' | 'path' | 'nodeType'>> & {
  article?: Partial<StorageArticleSettings> | null
}

//========================================================================
//
//  Implementation
//
//========================================================================

function newStorageDirNode(dirPath: string, data?: NewTestStorageNodeData): StorageNode {
  dirPath = removeBothEndsSlash(dirPath)
  data = data || {}
  const name = _path.basename(dirPath)
  const dir = removeStartDirChars(_path.dirname(dirPath))
  let nodeId: string
  if (data.article?.dir) {
    nodeId = _path.basename(dirPath)
  } else {
    nodeId = data.id || StorageNode.generateId()
  }
  const result: StorageNode = {
    id: nodeId,
    nodeType: 'Dir',
    name,
    dir,
    path: dirPath,
    url: StorageHelper.getNodeURL(nodeId),
    contentType: data.contentType || '',
    size: data.size || 0,
    share: merge(EmptyShareSettings(), data.share),
    article: data.article,
    version: 1,
    createdAt: dayjs.isDayjs(data.createdAt) ? data.createdAt : dayjs(),
    updatedAt: dayjs.isDayjs(data.updatedAt) ? data.updatedAt : dayjs(),
  }
  return result
}

function newStorageFileNode(filePath: string, data?: NewTestStorageNodeData): StorageNode {
  filePath = removeBothEndsSlash(filePath)
  data = data || {}
  const name = _path.basename(filePath)
  const dir = removeStartDirChars(_path.dirname(filePath))
  const nodeId = data.id || StorageNode.generateId()
  const result: StorageNode = {
    id: data.id || StorageNode.generateId(),
    nodeType: 'File',
    name,
    dir,
    path: filePath,
    url: StorageHelper.getNodeURL(nodeId),
    contentType: data.contentType || 'text/plain; charset=utf-8',
    size: data.size || 5,
    share: merge(EmptyShareSettings(), data.share),
    article: data.article,
    version: 1,
    createdAt: dayjs.isDayjs(data.createdAt) ? data.createdAt : dayjs(),
    updatedAt: dayjs.isDayjs(data.updatedAt) ? data.updatedAt : dayjs(),
  }
  return result
}

function cloneStorageNode(target: StorageNode, source: DeepPartial<StorageNode>): StorageNode {
  return merge({}, target, source)
}

function mockStorageServiceAPIMethods(params: Pick<TestServiceContainer, 'appStorage' | 'userStorage' | 'articleStorage'>): void {
  const { appStorage, userStorage, articleStorage } = params
  const storageServiceList = [appStorage, userStorage, articleStorage]

  for (const storageService of storageServiceList) {
    storageService.getNodeAPI.value = td.func() as any
    storageService.getNodesAPI.value = td.func() as any
    storageService.getDescendantsAPI.value = td.func() as any
    storageService.getChildrenAPI.value = td.func() as any
    storageService.getHierarchicalNodesAPI.value = td.func() as any
    storageService.getAncestorDirsAPI.value = td.func() as any
    storageService.createDirAPI.value = td.func() as any
    storageService.createHierarchicalDirsAPI.value = td.func() as any
    storageService.removeDirAPI.value = td.func() as any
    storageService.removeFileAPI.value = td.func() as any
    storageService.moveDirAPI.value = td.func() as any
    storageService.moveFileAPI.value = td.func() as any
    storageService.renameDirAPI.value = td.func() as any
    storageService.renameFileAPI.value = td.func() as any
    storageService.setDirShareSettingsAPI.value = td.func() as any
    storageService.setFileShareSettingsAPI.value = td.func() as any
    storageService.handleUploadedFileAPI.value = td.func() as any
    storageService.setFileAccessAuthClaimsAPI.value = td.func() as any
    storageService.removeFileAccessAuthClaimsAPI.value = td.func() as any
  }

  articleStorage.createArticleTypeDirAPI.value = td.func() as any
  articleStorage.createArticleGeneralDirAPI.value = td.func() as any
  articleStorage.renameArticleDirAPI.value = td.func() as any
  articleStorage.setArticleSortOrderAPI.value = td.func() as any
  articleStorage.saveArticleSrcMasterFileAPI.value = td.func() as any
  articleStorage.saveArticleSrcDraftFileAPI.value = td.func() as any
  articleStorage.getArticleChildrenAPI.value = td.func() as any
}

//========================================================================
//
//  Exports
//
//========================================================================

export { NewTestStorageNodeData, cloneStorageNode, mockStorageServiceAPIMethods, newStorageDirNode, newStorageFileNode }
