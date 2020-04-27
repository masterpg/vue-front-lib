import * as path from 'path'
import * as shortid from 'shortid'
import { StorageNode, StorageNodeShareSettings, StorageNodeType } from '@/lib'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import { cloneDeep } from 'lodash'
import dayjs from 'dayjs'

export const EMPTY_SHARE_SETTINGS: StorageNodeShareSettings = {
  isPublic: false,
  uids: [],
}

export function newTestStorageDirNode(dirPath: string, data?: Partial<Omit<StorageNode, 'name' | 'dir' | 'path' | 'nodeType'>>): StorageNode {
  dirPath = removeBothEndsSlash(dirPath)
  data = data || {}
  const name = path.basename(dirPath)
  const dir = removeStartDirChars(path.dirname(dirPath))
  const result: StorageNode = {
    id: data.id || shortid.generate(),
    nodeType: StorageNodeType.Dir,
    name,
    dir,
    path: dirPath,
    contentType: data.contentType || '',
    size: data.size || 0,
    share: data.share || cloneDeep(EMPTY_SHARE_SETTINGS),
    created: data.created || dayjs(),
    updated: data.updated || dayjs(),
  }
  return result
}

export function newTestStorageFileNode(filePath: string, data?: Partial<Omit<StorageNode, 'name' | 'dir' | 'path' | 'nodeType'>>): StorageNode {
  filePath = removeBothEndsSlash(filePath)
  data = data || {}
  const name = path.basename(filePath)
  const dir = removeStartDirChars(path.dirname(filePath))
  const result: StorageNode = {
    id: data.id || shortid.generate(),
    nodeType: StorageNodeType.File,
    name,
    dir,
    path: filePath,
    contentType: data.contentType || 'text/plain; charset=utf-8',
    size: data.size || 5,
    share: data.share || cloneDeep(EMPTY_SHARE_SETTINGS),
    created: data.created || dayjs(),
    updated: data.updated || dayjs(),
  }
  return result
}

export function cloneTestStorageNode(target: StorageNode, source: Partial<StorageNode>): StorageNode {
  return Object.assign({}, cloneDeep(target), cloneDeep(source))
}