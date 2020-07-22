import * as path from 'path'
import { StorageNode, StorageNodeShareSettings, StorageNodeType } from '@/lib'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
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
  const nodeId = data.id || generateFirestoreId()
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
    docBundleType: data.docBundleType || null,
    isDoc: data.isDoc || null,
    docSortOrder: data.docSortOrder || null,
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
    docBundleType: data.docBundleType || null,
    isDoc: data.isDoc || null,
    docSortOrder: data.docSortOrder || null,
    version: 1,
    createdAt: data.createdAt || dayjs(),
    updatedAt: data.updatedAt || dayjs(),
  }
  return result
}

function cloneTestStorageNode(target: StorageNode, source: Partial<StorageNode>): StorageNode {
  return Object.assign({}, cloneDeep(target), cloneDeep(source))
}

//========================================================================
//
//  Exports
//
//========================================================================

export { EMPTY_SHARE_SETTINGS, newTestStorageDirNode, newTestStorageFileNode, cloneTestStorageNode }
