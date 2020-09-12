import {
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
  articleNodeName: string | null
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

type StorageNodeActionType = 'createDir' | 'uploadFiles' | 'uploadDir' | 'move' | 'rename' | 'share' | 'delete' | 'reload' | 'createArticleTypeDir'

//========================================================================
//
//  Implementation
//
//========================================================================

//--------------------------------------------------
//  ContextMenu
//--------------------------------------------------

class StorageNodeActionEvent<T extends string = StorageNodeActionType> {
  constructor(type: T, nodePaths: string[], articleNodeType?: StorageArticleNodeType) {
    this.type = type
    this.nodePaths = nodePaths
    this.articleNodeType = articleNodeType

    switch (this.type) {
      case 'createDir':
        this.label = String(i18n.t('common.createSth', { sth: i18n.tc('common.folder', 1) }))
        break
      case 'uploadFiles':
        this.label = String(i18n.t('common.uploadSth', { sth: i18n.tc('common.file', 2) }))
        break
      case 'uploadDir':
        this.label = String(i18n.t('common.uploadSth', { sth: i18n.tc('common.folder', 2) }))
        break
      case 'move':
        this.label = String(i18n.t('common.move'))
        break
      case 'rename':
        this.label = String(i18n.t('common.rename'))
        break
      case 'share':
        this.label = String(i18n.t('common.share'))
        break
      case 'delete':
        this.label = String(i18n.t('common.delete'))
        break
      case 'reload':
        this.label = String(i18n.t('common.reload'))
        break
      case 'createArticleTypeDir': {
        switch (this.articleNodeType) {
          case StorageArticleNodeType.ListBundle:
            this.label = String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.listBundle') }))
            break
          case StorageArticleNodeType.CategoryBundle:
            this.label = String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.categoryBundle') }))
            break
          case StorageArticleNodeType.Category:
            this.label = String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.category') }))
            break
          case StorageArticleNodeType.Article:
            this.label = String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.article') }))
            break
        }
        break
      }
    }
  }

  readonly type: T

  readonly label: string = ''

  readonly nodePaths: string[]

  readonly articleNodeType?: StorageArticleNodeType
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageNodeActionEvent, StorageNodeActionType, StorageNodePopupMenuItem, StorageTreeNodeData, StorageTreeNodeInput }
