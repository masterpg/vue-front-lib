import {
  CompTreeNode,
  CompTreeNodeData,
  CompTreeViewLazyLoadStatus,
  StorageArticleNodeType,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeType,
  StorageType,
} from '@/lib'
import { Dayjs } from 'dayjs'
import { i18n } from '@/example/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageTreeNodeData extends CompTreeNodeData {
  storageType: StorageType
  icon: string
  id: string
  nodeType: StorageNodeType
  contentType: string
  size: number
  share: StorageNodeShareSettings
  articleNodeType: StorageArticleNodeType | null
  articleSortOrder: number | null
  url: string
  createdAt: Dayjs
  updatedAt: Dayjs
  disableContextMenu: boolean
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

interface StorageNodePopupMenuItem {
  type: string
  label: string
}

interface StorageNodeActionEvent {
  type: string
  nodePaths: string[]
}

//========================================================================
//
//  Implementation
//
//========================================================================

//--------------------------------------------------
//  ContextMenu
//--------------------------------------------------

interface StorageNodeActionType {
  readonly type: string
  readonly label: string
}

namespace StorageNodeActionType {
  export const createDir: StorageNodeActionType = new (class {
    readonly type = 'createDir'
    get label(): string {
      return String(i18n.t('common.createSth', { sth: i18n.tc('common.folder', 1) }))
    }
  })()

  export const uploadFiles: StorageNodeActionType = new (class {
    readonly type = 'uploadFiles'
    get label(): string {
      return String(i18n.t('common.uploadSth', { sth: i18n.tc('common.file', 2) }))
    }
  })()

  export const uploadDir: StorageNodeActionType = new (class {
    readonly type = 'uploadDir'
    get label(): string {
      return String(i18n.t('common.uploadSth', { sth: i18n.tc('common.folder', 2) }))
    }
  })()

  export const move: StorageNodeActionType = new (class {
    readonly type = 'move'
    get label(): string {
      return String(i18n.t('common.move'))
    }
  })()

  export const rename: StorageNodeActionType = new (class {
    readonly type = 'rename'
    get label(): string {
      return String(i18n.t('common.rename'))
    }
  })()

  export const share: StorageNodeActionType = new (class {
    readonly type = 'share'
    get label(): string {
      return String(i18n.t('common.share'))
    }
  })()

  export const deletion: StorageNodeActionType = new (class {
    readonly type = 'delete'
    get label(): string {
      return String(i18n.t('common.delete'))
    }
  })()

  export const reload: StorageNodeActionType = new (class {
    readonly type = 'reload'
    get label(): string {
      return String(i18n.t('common.reload'))
    }
  })()

  export const createListBundle: StorageNodeActionType = new (class {
    readonly type = 'createListBundle'
    get label(): string {
      return String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.listBundle') }))
    }
  })()

  export const createCategoryBundle: StorageNodeActionType = new (class {
    readonly type = 'createCategoryBundle'
    get label(): string {
      return String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.categoryBundle') }))
    }
  })()

  export const createCategoryDir: StorageNodeActionType = new (class {
    readonly type = 'createCategoryDir'
    get label(): string {
      return String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.categoryDir') }))
    }
  })()

  export const createArticleDir: StorageNodeActionType = new (class {
    readonly type = 'createArticleDir'
    get label(): string {
      return String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.articleDir') }))
    }
  })()

  export const separator: StorageNodeActionType = new (class {
    readonly type = 'separator'
    get label(): string {
      return ''
    }
  })()
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageNodeActionEvent, StorageNodeActionType, StorageNodePopupMenuItem, StorageTreeNodeData, StorageTreeNodeInput }
