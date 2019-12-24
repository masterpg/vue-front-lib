import { ChildrenSortFunc, CompTreeNodeData, StorageNode, StorageNodeType } from '@/lib'
import dayjs, { Dayjs } from 'dayjs'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import { removeBothEndsSlash } from 'web-base-lib'

export interface StorageTreeNodeData extends CompTreeNodeData {
  icon: 'storage' | 'folder' | 'description'
  parent?: string
  nodeType: StorageNodeType | 'Storage'
  created: Dayjs
  updated: Dayjs
}

/**
 * ツリービューのルートノードデータを取得します。
 */
export function getStorageTreeRootNodeData(): StorageTreeNodeData {
  return {
    value: '',
    label: 'Storage',
    icon: 'storage',
    opened: true,
    nodeType: 'Storage',
    nodeClass: StorageTreeNode,
    created: dayjs(0),
    updated: dayjs(0),
  }
}

/**
 * `StorageNode`をツリービューで扱える形式の`StorageTreeNodeData`へ変換します。
 * @param source
 */
export function toStorageTreeNodeData(source: StorageNode): StorageTreeNodeData {
  return {
    label: removeBothEndsSlash(source.name),
    value: removeBothEndsSlash(source.path),
    parent: removeBothEndsSlash(source.dir),
    icon: source.nodeType === StorageNodeType.Dir ? 'folder' : 'description',
    nodeType: source.nodeType,
    nodeClass: StorageTreeNode,
    created: source.created,
    updated: source.updated,
  }
}

export const storageTreeChildrenSortFunc: ChildrenSortFunc = (a, b) => {
  const _a = a as StorageTreeNode
  const _b = b as StorageTreeNode
  if (_a.nodeType === StorageNodeType.Dir && _b.nodeType === StorageNodeType.File) {
    return -1
  } else if (_a.nodeType === StorageNodeType.File && _b.nodeType === StorageNodeType.Dir) {
    return 1
  }
  if (_a.label < _b.label) {
    return -1
  } else if (_a.label > _b.label) {
    return 1
  } else {
    return 0
  }
}
