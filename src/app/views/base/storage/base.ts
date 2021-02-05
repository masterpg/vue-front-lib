import { DeepPartial, RequiredAre } from 'web-base-lib'
import { StorageArticleDirType, StorageArticleSettings, StorageNode, StorageNodeShareSettings, StorageNodeType, StorageType } from '@/app/service'
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
  version: number
  disableContextMenu: boolean
}

interface StorageTreeNodeEditData extends Partial<Omit<StorageTreeNodeData, 'article'>> {
  article?: DeepPartial<StorageTreeNodeData['article']>
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

interface StorageNodeActionEventType {
  createDir: { parentPath: string }
  uploadFiles: { parentPath: string }
  uploadDir: { parentPath: string }
  move: { targetPaths: string[] }
  rename: { targetPath: string }
  share: { targetPaths: string[] }
  delete: { targetPaths: string[] }
  reload: { targetPath: string }
  createArticleTypeDir: { parentPath: string; type: StorageArticleDirType }
  separator: void
}

//========================================================================
//
//  Implementation
//
//========================================================================

//--------------------------------------------------
//  ContextMenu
//--------------------------------------------------

class StorageNodeActionEvent<T extends keyof StorageNodeActionEventType = any> {
  constructor(type: T, params: StorageNodeActionEventType[T]) {
    const i18n = useI18n()
    this.type = type
    this.params = params

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
        const _params = params as StorageNodeActionEventType['createArticleTypeDir']
        switch (_params.type) {
          case StorageArticleDirType.ListBundle:
            this.label = String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.listBundle') }))
            break
          case StorageArticleDirType.TreeBundle:
            this.label = String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.treeBundle') }))
            break
          case StorageArticleDirType.Category:
            this.label = String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.category') }))
            break
          case StorageArticleDirType.Article:
            this.label = String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.article') }))
            break
        }
        break
      }
      case 'separator':
        this.label = ''
        break
    }
  }

  readonly type: keyof StorageNodeActionEventType

  readonly label: string = ''

  readonly params: StorageNodeActionEventType[T]
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StorageNodeActionEvent, StorageTreeNodeData, StorageTreeNodeEditData, StorageTreeNodeInput }
