import { DeepPartial, removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import { StorageNode, StorageNodeShareSettings, StorageNodeType } from '@/app/logic'
import { cloneDeep, merge } from 'lodash'
import { StorageLogic } from '@/app/logic/modules/storage'
import { TestLogicContainer } from '../index'
import _path from 'path'
import dayjs from 'dayjs'

//========================================================================
//
//  Implementation
//
//========================================================================

const EMPTY_SHARE_SETTINGS: StorageNodeShareSettings = {
  isPublic: null,
  readUIds: null,
  writeUIds: null,
}

type NewTestStorageNodeData = DeepPartial<Omit<StorageNode, 'name' | 'dir' | 'path' | 'nodeType'>>

function newTestStorageDirNode(dirPath: string, data?: NewTestStorageNodeData): StorageNode {
  dirPath = removeBothEndsSlash(dirPath)
  data = data || {}
  const name = _path.basename(dirPath)
  const dir = removeStartDirChars(_path.dirname(dirPath))
  let nodeId: string
  if (data.articleNodeType) {
    nodeId = _path.basename(dirPath)
  } else {
    nodeId = data.id || StorageNode.generateId()
  }
  const result: StorageNode = {
    id: nodeId,
    nodeType: StorageNodeType.Dir,
    name,
    dir,
    path: dirPath,
    url: StorageLogic.getNodeURL(nodeId),
    contentType: data.contentType || '',
    size: data.size || 0,
    share: merge(cloneDeep(EMPTY_SHARE_SETTINGS), data.share),
    articleNodeName: data.articleNodeName || null,
    articleNodeType: data.articleNodeType || null,
    articleSortOrder: data.articleSortOrder || null,
    isArticleFile: data.isArticleFile ?? false,
    version: 1,
    createdAt: dayjs.isDayjs(data.createdAt) ? data.createdAt : dayjs(),
    updatedAt: dayjs.isDayjs(data.updatedAt) ? data.updatedAt : dayjs(),
  }
  return result
}

function newTestStorageFileNode(filePath: string, data?: NewTestStorageNodeData): StorageNode {
  filePath = removeBothEndsSlash(filePath)
  data = data || {}
  const name = _path.basename(filePath)
  const dir = removeStartDirChars(_path.dirname(filePath))
  const nodeId = data.id || StorageNode.generateId()
  const result: StorageNode = {
    id: data.id || StorageNode.generateId(),
    nodeType: StorageNodeType.File,
    name,
    dir,
    path: filePath,
    url: StorageLogic.getNodeURL(nodeId),
    contentType: data.contentType || 'text/plain; charset=utf-8',
    size: data.size || 5,
    share: merge(cloneDeep(EMPTY_SHARE_SETTINGS), data.share),
    articleNodeName: data.articleNodeName || null,
    articleNodeType: data.articleNodeType || null,
    articleSortOrder: data.articleSortOrder || null,
    isArticleFile: data.isArticleFile ?? false,
    version: 1,
    createdAt: dayjs.isDayjs(data.createdAt) ? data.createdAt : dayjs(),
    updatedAt: dayjs.isDayjs(data.updatedAt) ? data.updatedAt : dayjs(),
  }
  return result
}

function cloneTestStorageNode(target: StorageNode, source: Partial<StorageNode>): StorageNode {
  return Object.assign({}, cloneDeep(target), cloneDeep(source))
}

function mockStorageLogicAPIMethods(params: Pick<TestLogicContainer, 'appStorage' | 'userStorage' | 'articleStorage'>): void {
  const { appStorage, userStorage, articleStorage } = params
  const storageLogicList = [appStorage, userStorage, articleStorage]

  for (const storageLogic of storageLogicList) {
    storageLogic.getNodeAPI.value = td.func() as any
    storageLogic.getNodesAPI.value = td.func() as any
    storageLogic.getDirDescendantsAPI.value = td.func() as any
    storageLogic.getDescendantsAPI.value = td.func() as any
    storageLogic.getDirChildrenAPI.value = td.func() as any
    storageLogic.getChildrenAPI.value = td.func() as any
    storageLogic.getHierarchicalNodesAPI.value = td.func() as any
    storageLogic.getAncestorDirsAPI.value = td.func() as any
    storageLogic.createDirAPI.value = td.func() as any
    storageLogic.createHierarchicalDirsAPI.value = td.func() as any
    storageLogic.removeDirAPI.value = td.func() as any
    storageLogic.removeFileAPI.value = td.func() as any
    storageLogic.moveDirAPI.value = td.func() as any
    storageLogic.moveFileAPI.value = td.func() as any
    storageLogic.renameDirAPI.value = td.func() as any
    storageLogic.renameFileAPI.value = td.func() as any
    storageLogic.setDirShareSettingsAPI.value = td.func() as any
    storageLogic.setFileShareSettingsAPI.value = td.func() as any
    storageLogic.handleUploadedFileAPI.value = td.func() as any
  }

  articleStorage.createArticleTypeDirAPI.value = td.func() as any
  articleStorage.createArticleGeneralDirAPI.value = td.func() as any
  articleStorage.renameArticleNodeAPI.value = td.func() as any
  articleStorage.setArticleSortOrderAPI.value = td.func() as any
  articleStorage.getArticleChildrenAPI.value = td.func() as any
}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  EMPTY_SHARE_SETTINGS,
  NewTestStorageNodeData,
  cloneTestStorageNode,
  mockStorageLogicAPIMethods,
  newTestStorageDirNode,
  newTestStorageFileNode,
}
