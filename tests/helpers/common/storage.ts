import * as path from 'path'
import * as td from 'testdouble'
import { StorageNode, StorageNodeShareSettings, StorageNodeType } from '@/lib'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import { AppStorageLogic } from '../../../src/lib/logic/modules/storage/logic'
import { Component } from 'vue-property-decorator'
import { cloneDeep } from 'lodash'
import dayjs from 'dayjs'
import { generateFirestoreId } from './base'
import { getStorageNodeURL } from '../../../src/lib/logic/base'

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

function newTestStorageDirNode(dirPath: string, data?: Partial<Omit<StorageNode, 'name' | 'dir' | 'path' | 'nodeType'>>): StorageNode {
  dirPath = removeBothEndsSlash(dirPath)
  data = data || {}
  const name = path.basename(dirPath)
  const dir = removeStartDirChars(path.dirname(dirPath))
  let nodeId: string
  if (data.articleNodeType) {
    nodeId = path.basename(dirPath)
  } else {
    nodeId = data.id || generateFirestoreId()
  }
  const result: StorageNode = {
    id: nodeId,
    nodeType: StorageNodeType.Dir,
    name,
    dir,
    path: dirPath,
    url: getStorageNodeURL(nodeId),
    contentType: data.contentType || '',
    size: data.size || 0,
    share: data.share || cloneDeep(EMPTY_SHARE_SETTINGS),
    articleNodeName: data.articleNodeName || null,
    articleNodeType: data.articleNodeType || null,
    articleSortOrder: data.articleSortOrder || null,
    version: 1,
    createdAt: data.createdAt || dayjs(),
    updatedAt: data.updatedAt || dayjs(),
  }
  return result
}

function newTestStorageFileNode(filePath: string, data?: Partial<Omit<StorageNode, 'name' | 'dir' | 'path' | 'nodeType'>>): StorageNode {
  filePath = removeBothEndsSlash(filePath)
  data = data || {}
  const name = path.basename(filePath)
  const dir = removeStartDirChars(path.dirname(filePath))
  const nodeId = data.id || generateFirestoreId()
  const result: StorageNode = {
    id: data.id || generateFirestoreId(),
    nodeType: StorageNodeType.File,
    name,
    dir,
    path: filePath,
    url: getStorageNodeURL(nodeId),
    contentType: data.contentType || 'text/plain; charset=utf-8',
    size: data.size || 5,
    share: data.share || cloneDeep(EMPTY_SHARE_SETTINGS),
    articleNodeName: data.articleNodeName || null,
    articleNodeType: data.articleNodeType || null,
    articleSortOrder: data.articleSortOrder || null,
    version: 1,
    createdAt: data.createdAt || dayjs(),
    updatedAt: data.updatedAt || dayjs(),
  }
  return result
}

function cloneTestStorageNode(target: StorageNode, source: Partial<StorageNode>): StorageNode {
  return Object.assign({}, cloneDeep(target), cloneDeep(source))
}

@Component
class MockAppStorageLogic extends AppStorageLogic {
  get basePath(): string {
    return 'test'
  }

  getNodeAPI = td.func() as any
  getDirDescendantsAPI = td.func() as any
  getDescendantsAPI = td.func() as any
  getDirChildrenAPI = td.func() as any
  getChildrenAPI = td.func() as any
  getHierarchicalNodesAPI = td.func() as any
  getAncestorDirsAPI = td.func() as any
  createDirAPI = td.func() as any
  createHierarchicalDirsAPI = td.func() as any
  removeDirAPI = td.func() as any
  removeFileAPI = td.func() as any
  moveDirAPI = td.func() as any
  moveFileAPI = td.func() as any
  renameDirAPI = td.func() as any
  renameFileAPI = td.func() as any
  setDirShareSettingsAPI = td.func() as any
  setFileShareSettingsAPI = td.func() as any

  validateSignedIn = td.func() as any
}

//========================================================================
//
//  Exports
//
//========================================================================

export { EMPTY_SHARE_SETTINGS, newTestStorageDirNode, newTestStorageFileNode, cloneTestStorageNode, MockAppStorageLogic }
