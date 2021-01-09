import { DeepPartial, RequiredAre } from 'web-base-lib'
import {
  StorageArticleDirSettings,
  StorageArticleDirType,
  StorageArticleFileSettings,
  StorageArticleSettings,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeType,
  StorageType,
} from '@/app/logic'
import { TreeNodeData, TreeViewLazyLoadStatus } from '@/app/components/tree-view'
import { Dayjs } from 'dayjs'
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
  article?: StorageArticleSettings
  url: string
  createdAt: Dayjs
  updatedAt: Dayjs
  disableContextMenu: boolean
}

interface StorageTreeNodeEditData extends Partial<Omit<StorageTreeNodeData, 'article'>> {
  article?: DeepPartial<StorageTreeNodeData['article']>
}

interface StorageArticleTypeInput {
  dir?: Pick<StorageArticleDirSettings, 'type'>
  file?: Pick<StorageArticleFileSettings, 'type'>
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
  constructor(type: T, nodePaths: string[], article?: StorageArticleTypeInput) {
    const { t, tc } = useI18n()
    this.type = type
    this.nodePaths = nodePaths
    this.article = article

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
        switch (this.article?.dir?.type) {
          case StorageArticleDirType.ListBundle:
            this.label = String(t('common.createSth', { sth: t('article.nodeType.listBundle') }))
            break
          case StorageArticleDirType.CategoryBundle:
            this.label = String(t('common.createSth', { sth: t('article.nodeType.categoryBundle') }))
            break
          case StorageArticleDirType.Category:
            this.label = String(t('common.createSth', { sth: t('article.nodeType.category') }))
            break
          case StorageArticleDirType.Article:
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

  readonly article?: StorageArticleTypeInput
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageArticleTypeInput, StorageNodeActionEvent, StorageNodeActionType, StorageTreeNodeData, StorageTreeNodeEditData, StorageTreeNodeInput }
