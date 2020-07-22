import {
  ChildrenSortFunc,
  CompTreeNode,
  CompTreeNodeData,
  CompTreeViewLazyLoadStatus,
  CompTreeViewUtils,
  RequiredStorageNodeShareSettings,
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

@Component
class StorageTypeMixin extends Vue {
  @Prop({ required: true })
  storageType!: StorageType

  protected get storageLogic(): StorageLogic {
    return this.m_storageTypeData.page.storageLogic
  }

  protected get storageRoute(): StorageRoute {
    return this.m_storageTypeData.page.storageRoute
  }

  private get m_storageTypeData(): StorageTypeData {
    return StorageTypeData.get(this.storageType)
  }

  readonly pageStore = new (class {
    constructor(private m_storageType: StorageType) {}

    get rootNode(): StorageTreeNode {
      return this.m_storageTypeData.rootNode
    }

    get isInitialPull(): boolean {
      return this.m_storageTypeData.isInitialPull
    }

    set isInitialPull(value: boolean) {
      this.m_storageTypeData.isInitialPull = value
    }

    get isPageActive(): boolean {
      return this.m_storageTypeData.isPageActive
    }

    set isPageActive(value: boolean) {
      this.m_storageTypeData.isPageActive = value
    }

    get m_storageTypeData(): StorageTypeData {
      return StorageTypeData.get(this.m_storageType)
    }
  })(this.storageType)
}

@Component
class StorageTypeData extends Vue {
  private static dict: { [storageType: string]: StorageTypeData } = {}

  static get(storageType: StorageType): StorageTypeData {
    return StorageTypeData.dict[storageType]
  }

  static register(page: BaseStoragePage): void {
    const storageType = page.storageType
    let storageTypeData = StorageTypeData.get(storageType)
    if (storageTypeData) return

    // プログラム的にコンポーネントのインスタンスを生成
    // https://css-tricks.com/creating-vue-js-component-instances-programmatically/
    const ComponentClass = Vue.extend(StorageTypeData)
    storageTypeData = new ComponentClass({
      propsData: {
        page,
        rootNode: this.createRootNode(storageType),
      },
    }) as StorageTypeData
    StorageTypeData.dict[storageType] = storageTypeData
  }

  private static createRootNode(storageType: StorageType): StorageTreeNode {
    const label = (() => {
      switch (storageType) {
        case 'user':
          return String(i18n.t('storage.userRootName'))
        case 'app':
          return String(i18n.t('storage.appRootName'))
        case 'docs':
          return String(i18n.t('storage.docsRootName'))
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
    for (const storageTypeData of Object.values(StorageTypeData.dict)) {
      delete StorageTypeData.dict[storageTypeData.storageType]
      storageTypeData.$destroy()
    }
    StorageTypeData.dict = {}
  }

  @Prop({ required: true })
  page!: BaseStoragePage

  @Prop({ required: true })
  rootNode!: StorageTreeNode

  @Prop({ default: false })
  isInitialPull!: boolean

  @Prop({ default: false })
  isPageActive!: boolean

  get storageType(): StorageType {
    return this.page.storageType
  }

  @Watch('$logic.auth.isSignedIn')
  private m_isSignedInOnChange(newValue: boolean, oldValue: boolean) {
    // ページが非アクティブな状態でサインアウトされた場合、対象のストレージタイプデータを削除する
    // ※ページが非アクティブな状態とは、ストレージタイプとひも付くページが表示されていない状態であり、
    //   またツリービューも破棄されていることを意味する。
    if (!this.isPageActive && !this.$logic.auth.isSignedIn) {
      const storageTypeData = StorageTypeData.get(this.storageType)
      if (storageTypeData) {
        delete StorageTypeData.dict[this.storageType]
        storageTypeData.$destroy()
      }
    }
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
  StorageTreeNode,
  StorageTreeNodeData,
  StorageTreeNodeInput,
  StorageType,
  StorageTypeData,
  StorageTypeMixin,
  nodeToTreeData,
  treeSortFunc,
}
