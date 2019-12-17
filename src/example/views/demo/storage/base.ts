import { ChildrenSortFunc, CompTreeNodeData, StorageNode, StorageNodeType } from '@/lib'
import { StorageTreeNode } from '@/example/views/demo/storage/storage-tree-store'
import StorageTreeNodeItem from '@/example/views/demo/storage/storage-tree-node-item.vue'
import { removeBothEndsSlash } from 'web-base-lib'

export interface StorageTreeNodeData extends CompTreeNodeData {
  icon: 'storage' | 'folder' | 'description'
  parent?: string
  nodeType: StorageNodeType | 'Storage'
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
    itemClass: StorageTreeNodeItem,
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
    itemClass: StorageTreeNodeItem,
  }
}

export const storageTreeChildrenSortFunc: ChildrenSortFunc<StorageTreeNode> = (a, b) => {
  if (a.item.nodeType === StorageNodeType.Dir && b.item.nodeType === StorageNodeType.File) {
    return -1
  } else if (a.item.nodeType === StorageNodeType.File && b.item.nodeType === StorageNodeType.Dir) {
    return 1
  }
  if (a.label < b.label) {
    return -1
  } else if (a.label > b.label) {
    return 1
  } else {
    return 0
  }
}
