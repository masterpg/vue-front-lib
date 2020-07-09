import {
  ChildrenSortFunc,
  CompTreeNode,
  CompTreeNodeData,
  CompTreeViewLazyLoadStatus,
  RequiredStorageNodeShareSettings,
  StorageLogic,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeType,
} from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import BaseStoragePage from './base-storage-page.vue'
import { Dayjs } from 'dayjs'
import { StorageRoute } from '@/example/router'
import StorageTreeNodeClass from './storage-tree-node.vue'
import Vue from 'vue'
import { i18n } from '@/example/i18n'
import { removeBothEndsSlash } from 'web-base-lib'

//========================================================================
//
//  Interfaces
//
//========================================================================

type StorageType = 'user' | 'app' | 'docs'

interface StorageTreeNodeData extends CompTreeNodeData {
  icon: string
  id: string
  nodeType: StorageNodeType
  contentType: string
  size: number
  share: StorageNodeShareSettings
  url: string
  createdAt: Dayjs
  updatedAt: Dayjs
  disableContextMenu?: boolean
}

/**
 * `StorageNode`をツリービューノードへ変換する際に
 * 必要となるプロパティを追加したインタフェースです。
 */
interface StorageTreeNodeInput extends StorageNode {
  icon?: string
  opened?: boolean
  lazyLoadStatus?: CompTreeViewLazyLoadStatus
  disableContextMenu?: boolean
}

interface StorageTreeNode extends CompTreeNode<StorageTreeNode> {
  readonly id: string
  readonly name: string
  readonly dir: string
  readonly path: string
  readonly nodeType: StorageNodeType
  readonly nodeTypeName: string
  readonly contentType: string
  readonly size: number
  readonly share: StorageNodeShareSettings
  readonly url: string
  readonly createdAt: Dayjs
  readonly updatedAt: Dayjs
  disableContextMenu?: boolean
  readonly inheritedShare: RequiredStorageNodeShareSettings
}

namespace StorageTreeNode {
  export const clazz = StorageTreeNodeClass
}

interface StorageNodeContextMenuItem {
  type: string
  label: string
}

interface StorageNodeContextMenuSelectedEvent {
  type: string
  nodePaths: string[]
}

//========================================================================
//
//  Implementation
//
//========================================================================

const storagePageDict: { [storageType: string]: BaseStoragePage } = {}

function registerStoragePage(page: BaseStoragePage): void {
  storagePageDict[page.storageType] = page
}

@Component
class StorageTypeMixin extends Vue {
  @Prop({ required: true })
  storageType!: StorageType

  protected get storageLogic(): StorageLogic {
    return this.m_storagePage.storageLogic
  }

  protected get storageRoute(): StorageRoute {
    return this.m_storagePage.storageRoute
  }

  protected get rootTreeNode(): StorageTreeNode | null {
    if (!this.m_storagePage.treeView) return null
    return this.m_storagePage.treeView.rootNode
  }

  protected get selectedTreeNode(): StorageTreeNode | null {
    if (!this.m_storagePage.treeView) return null
    return this.m_storagePage.treeView.selectedNode
  }

  private get m_storagePage(): BaseStoragePage {
    return storagePageDict[this.storageType]
  }
}

const treeSortFunc: ChildrenSortFunc = <StorageNode>(a, b) => {
  if (a.nodeType === StorageNodeType.Dir && b.nodeType === StorageNodeType.File) {
    return -1
  } else if (a.nodeType === StorageNodeType.File && b.nodeType === StorageNodeType.Dir) {
    return 1
  }
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
}

/**
 * ストレージノードまたはツリーノードをツリービューで扱える形式へ変換します。
 * @param source
 */
function nodeToTreeData(source: StorageTreeNodeInput | StorageTreeNode): StorageTreeNodeData {
  const result = {
    value: removeBothEndsSlash(source.path),
    label: removeBothEndsSlash(source.name),
    icon: source.icon ? source.icon : source.nodeType === StorageNodeType.Dir ? 'folder' : 'description',
    nodeClass: StorageTreeNode.clazz,
    lazy: source.nodeType === StorageNodeType.Dir,
    sortFunc: treeSortFunc,
    id: source.id,
    nodeType: source.nodeType,
    contentType: source.contentType,
    size: source.size,
    share: {
      isPublic: source.share.isPublic,
      readUIds: source.share.readUIds ? [...source.share.readUIds] : null,
      writeUIds: source.share.writeUIds ? [...source.share.writeUIds] : null,
    },
    url: source.url,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  } as StorageTreeNodeData

  if (typeof source.opened === 'boolean') {
    result.opened = source.opened
  }
  if (typeof source.lazyLoadStatus === 'string') {
    result.lazyLoadStatus = source.lazyLoadStatus
  }
  if (typeof source.disableContextMenu === 'boolean') {
    result.disableContextMenu = source.disableContextMenu
  }

  return result
}

//--------------------------------------------------
//  ContextMenu
//--------------------------------------------------

class StorageNodeContextMenuTypeImpl {
  readonly createDir: StorageNodeContextMenuItem = new (class {
    readonly type = 'createDir'
    get label(): string {
      return String(i18n.t('common.createSomehow', { somehow: i18n.tc('common.folder', 1) }))
    }
  })()

  readonly uploadFiles: StorageNodeContextMenuItem = new (class {
    readonly type = 'uploadFiles'
    get label(): string {
      return String(i18n.t('common.uploadSomehow', { somehow: i18n.tc('common.file', 2) }))
    }
  })()

  readonly uploadDir: StorageNodeContextMenuItem = new (class {
    readonly type = 'uploadDir'
    get label(): string {
      return String(i18n.t('common.uploadSomehow', { somehow: i18n.tc('common.folder', 2) }))
    }
  })()

  readonly move: StorageNodeContextMenuItem = new (class {
    readonly type = 'move'
    get label(): string {
      return String(i18n.t('common.move'))
    }
  })()

  readonly rename: StorageNodeContextMenuItem = new (class {
    readonly type = 'rename'
    get label(): string {
      return String(i18n.t('common.rename'))
    }
  })()

  readonly share: StorageNodeContextMenuItem = new (class {
    readonly type = 'share'
    get label(): string {
      return String(i18n.t('common.share'))
    }
  })()

  readonly deletion: StorageNodeContextMenuItem = new (class {
    readonly type = 'delete'
    get label(): string {
      return String(i18n.t('common.delete'))
    }
  })()

  readonly reload: StorageNodeContextMenuItem = new (class {
    readonly type = 'reload'
    get label(): string {
      return String(i18n.t('common.reload'))
    }
  })()
}

const StorageNodeContextMenuType = new StorageNodeContextMenuTypeImpl()

//========================================================================
//
//  Exports
//
//========================================================================

export {
  StorageNodeContextMenuItem,
  StorageNodeContextMenuSelectedEvent,
  StorageNodeContextMenuType,
  StorageNodeContextMenuTypeImpl,
  StorageTreeNodeInput,
  StorageTreeNode,
  StorageTreeNodeData,
  StorageType,
  StorageTypeMixin,
  nodeToTreeData,
  registerStoragePage,
  treeSortFunc,
}
