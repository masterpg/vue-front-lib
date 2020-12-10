import { StorageArticleNodeType, StorageNode, StorageNodeShareSettings, StorageNodeType, StorageType } from '@/app/logic'
import { TreeNodeData, TreeViewLazyLoadStatus } from '@/app/components/tree-view'
import { Dayjs } from 'dayjs'
import { RequiredAre } from 'web-base-lib'
import { useI18n } from '@/app/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageTreeNodeData extends RequiredAre<TreeNodeData, 'icon' | 'opened' | 'lazy' | 'lazyLoadStatus' | 'sortFunc' | 'selected'> {
  storageType: StorageType
  id: string
  nodeType: StorageNodeType
  contentType: string
  size: number
  share: StorageNodeShareSettings
  articleNodeName: string | null
  articleNodeType: StorageArticleNodeType | null
  articleSortOrder: number | null
  isArticleFile: boolean
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
  lazyLoadStatus?: TreeViewLazyLoadStatus
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
    const { t, tc } = useI18n()
    this.type = type
    this.nodePaths = nodePaths
    this.articleNodeType = articleNodeType

    switch (this.type) {
      case 'createDir':
        this.label = String(t('common.createSth', { sth: tc('common.folder', 1) }))
        break
      case 'uploadFiles':
        this.label = String(t('common.uploadSth', { sth: tc('common.file', 2) }))
        break
      case 'uploadDir':
        this.label = String(t('common.uploadSth', { sth: tc('common.folder', 2) }))
        break
      case 'move':
        this.label = String(t('common.move'))
        break
      case 'rename':
        this.label = String(t('common.rename'))
        break
      case 'share':
        this.label = String(t('common.share'))
        break
      case 'delete':
        this.label = String(t('common.delete'))
        break
      case 'reload':
        this.label = String(t('common.reload'))
        break
      case 'createArticleTypeDir': {
        switch (this.articleNodeType) {
          case StorageArticleNodeType.ListBundle:
            this.label = String(t('common.createSth', { sth: t('article.nodeType.listBundle') }))
            break
          case StorageArticleNodeType.CategoryBundle:
            this.label = String(t('common.createSth', { sth: t('article.nodeType.categoryBundle') }))
            break
          case StorageArticleNodeType.Category:
            this.label = String(t('common.createSth', { sth: t('article.nodeType.category') }))
            break
          case StorageArticleNodeType.Article:
            this.label = String(t('common.createSth', { sth: t('article.nodeType.article') }))
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
