import {
  ChildrenSortFunc,
  CompTreeNode,
  CompTreeNodeData,
  CompTreeViewLazyLoadStatus,
  CompTreeViewUtils,
  RequiredStorageNodeShareSettings,
  StorageArticleNodeType,
  StorageLogic,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeType,
} from '@/lib'
import { Component, Prop, Watch } from 'vue-property-decorator'
import dayjs, { Dayjs } from 'dayjs'
import BaseStoragePage from './base-storage-page.vue'
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

type StorageType = 'user' | 'app' | 'article'

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
  export type type = StorageTreeNodeClass
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

@Component
class StoragePageMixin extends Vue {
  @Prop({ required: true })
  storageType!: StorageType

  protected get storageLogic(): StorageLogic {
    return this.pageStore.page.storageLogic
  }

  protected get storageRoute(): StorageRoute {
    return this.pageStore.page.storageRoute
  }

  get pageStore(): StoragePageStore {
    return StoragePageStore.get(this.storageType)
  }
}

@Component
class StoragePageStore extends Vue {
  private static dict: { [storageType: string]: StoragePageStore } = {}

  static get(storageType: StorageType): StoragePageStore {
    return StoragePageStore.dict[storageType]
  }

  static register(storageType: StorageType, page: BaseStoragePage): void {
    let pageStore = StoragePageStore.get(storageType)
    if (pageStore) {
      pageStore.page = page
      return
    }

    // プログラム的にコンポーネントのインスタンスを生成
    // https://css-tricks.com/creating-vue-js-component-instances-programmatically/
    const ComponentClass = Vue.extend(StoragePageStore)
    pageStore = new ComponentClass({
      data: {
        storageType,
        page,
        rootNode: this.createRootNode(storageType),
      },
    }) as StoragePageStore
    StoragePageStore.dict[storageType] = pageStore
  }

  static unregister(storageType: StorageType): void {
    const pageStore = StoragePageStore.get(storageType)
    if (!pageStore) return

    pageStore.page = null as any
  }

  private static createRootNode(storageType: StorageType): StorageTreeNode {
    const label = (() => {
      switch (storageType) {
        case 'user':
          return String(i18n.t('storage.userRootName'))
        case 'app':
          return String(i18n.t('storage.appRootName'))
        case 'article':
          return String(i18n.t('storage.articleRootName'))
      }
    })()

    const rootNodeData: StorageTreeNodeData = {
      nodeClass: StorageTreeNode.clazz,
      label,
      value: '',
      icon: 'storage',
      opened: false,
      lazy: false,
      sortFunc: treeSortFunc,
      selected: true,
      id: '',
      nodeType: StorageNodeType.Dir,
      contentType: '',
      size: 0,
      share: {
        isPublic: false,
        readUIds: [],
        writeUIds: [],
      },
      url: '',
      createdAt: dayjs(0),
      updatedAt: dayjs(0),
    }

    return CompTreeViewUtils.newNode<StorageTreeNode>(rootNodeData)
  }

  static clear(): void {
    for (const pageStore of Object.values(StoragePageStore.dict)) {
      delete StoragePageStore.dict[pageStore.storageType]
      pageStore.$destroy()
    }
    StoragePageStore.dict = {}
  }

  storageType: StorageType = null as any

  page: BaseStoragePage = null as any

  rootNode: StorageTreeNode = null as any

  isInitialPull = false

  get isPageActive(): boolean {
    return Boolean(this.page)
  }

  @Watch('$logic.auth.isSignedIn')
  private m_isSignedInOnChange(newValue: boolean, oldValue: boolean) {
    // ページが非アクティブな状態でサインアウトされた場合、対象のストレージページデータを削除する
    // ※ページが非アクティブな状態とは、ストレージタイプとひも付くページが表示されていない状態であり、
    //   またツリービューも破棄されていることを意味する。
    if (!this.isPageActive && !this.$logic.auth.isSignedIn) {
      const pageStore = StoragePageStore.get(this.storageType)
      if (pageStore) {
        delete StoragePageStore.dict[this.storageType]
        pageStore.rootNode.$destroy()
        pageStore.$destroy()
      }
    }
  }
}

const treeSortFunc: ChildrenSortFunc<StorageTreeNode.type> = (a, b) => {
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
    icon: getStorageNodeTypeIcon(source.nodeType),
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

/**
 * ストレージタイプのラベルを取得します。
 * @param nodeType
 * @param choice
 */
function getStorageNodeTypeLabel(nodeType: StorageNodeType, choice = 1): string {
  switch (nodeType) {
    case StorageNodeType.Dir:
      return String(i18n.tc('common.folder', choice))
    case StorageNodeType.File:
      return String(i18n.tc('common.file', choice))
  }
}

/**
 * ストレージタイプのアイコンを取得します。
 * @param nodeType
 * @param choice
 */
function getStorageNodeTypeIcon(nodeType: StorageNodeType, choice = 1): string {
  switch (nodeType) {
    case StorageNodeType.Dir:
      return 'folder'
    case StorageNodeType.File:
      return 'description'
  }
}

/**
 * 記事ノードタイプのラベルを取得します。
 * @param nodeType
 * @param choice
 */
function getArticleNodeTypeLabel(nodeType: StorageArticleNodeType, choice = 1): string {
  switch (nodeType) {
    case StorageArticleNodeType.ListBundle:
      return String(i18n.tc('article.nodeType.listBundle', choice))
    case StorageArticleNodeType.CategoryBundle:
      return String(i18n.tc('article.nodeType.categoryBundle', choice))
    case StorageArticleNodeType.CategoryDir:
      return String(i18n.tc('article.nodeType.categoryDir', choice))
    case StorageArticleNodeType.ArticleDir:
      return String(i18n.tc('article.nodeType.articleDir', choice))
  }
}

/**
 * 記事ノードタイプのアイコンを取得します。
 * @param nodeType
 */
function getArticleNodeTypeIcon(nodeType: StorageArticleNodeType): string {
  switch (nodeType) {
    case StorageArticleNodeType.ListBundle:
      return 'view_list'
    case StorageArticleNodeType.CategoryBundle:
      return 'category'
    case StorageArticleNodeType.CategoryDir:
      return 'folder'
    case StorageArticleNodeType.ArticleDir:
      return 'description'
  }
}

//--------------------------------------------------
//  ContextMenu
//--------------------------------------------------

interface StorageNodeActionType {
  readonly type: string
  readonly label: string
}

namespace StorageNodeActionType {
  export const createDir: StorageNodeActionType = new (class {
    type = 'createDir'
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
}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  StorageNodePopupMenuItem,
  StorageNodeActionEvent,
  StorageNodeActionType,
  StoragePageMixin,
  StoragePageStore,
  StorageTreeNode,
  StorageTreeNodeData,
  StorageTreeNodeInput,
  StorageType,
  getArticleNodeTypeIcon,
  getArticleNodeTypeLabel,
  getStorageNodeTypeIcon,
  getStorageNodeTypeLabel,
  nodeToTreeData,
  treeSortFunc,
}
