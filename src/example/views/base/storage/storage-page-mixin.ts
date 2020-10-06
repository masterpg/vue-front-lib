import * as path from 'path'
import { Component, Prop, Watch } from 'vue-property-decorator'
import { StorageArticleNodeType, StorageLogic, StorageNode, StorageNodeType, StorageType } from '@/example/logic'
import { StorageRoute, router } from '@/example/router'
import { StorageTreeNodeData, StorageTreeNodeInput } from './base'
import { removeBothEndsSlash, removeStartDirChars } from 'web-base-lib'
import BaseStoragePage from './base-storage-page.vue'
import { CompTreeViewUtils } from '@/example/components'
import StorageTreeNode from './storage-tree-node.vue'
import Vue from 'vue'
import { config } from '@/example/config'
import dayjs from 'dayjs'
import { i18n } from '@/example/i18n'

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class StoragePageMixin extends Vue {
  constructor() {
    super()

    switch (this.storageType) {
      case 'app':
        this.storageLogic = this.$logic.appStorage
        break
      case 'user':
        this.storageLogic = this.$logic.userStorage
        break
      case 'article':
        this.storageLogic = this.$logic.articleStorage
        break
    }

    switch (this.storageType) {
      case 'app':
        this.storageRoute = router.views.demo.appStorage
        break
      case 'user':
        this.storageRoute = router.views.demo.userStorage
        break
      case 'article':
        this.storageRoute = router.views.admin.article
        break
    }
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ required: true })
  storageType!: StorageType

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected readonly storageLogic: StorageLogic

  protected readonly storageRoute: StorageRoute

  get pageStore(): StoragePageStore {
    return StoragePageStore.get(this.storageType)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * ストレージノードまたはツリーノードをツリービューで扱える形式へ変換します。
   * @param storageType
   * @param source
   */
  protected nodeToTreeData(storageType: StorageType, source: StorageTreeNodeInput | StorageTreeNode): StorageTreeNodeData {
    const result = {
      storageType,
      value: removeBothEndsSlash(source.path),
      label: this.getDisplayName(source),
      icon: this.getNodeIcon(source),
      nodeClass: require('./storage-tree-node.vue').default,
      lazy: source.nodeType === StorageNodeType.Dir,
      sortFunc: StorageLogic.childrenSortFunc,
      id: source.id,
      nodeType: source.nodeType,
      contentType: source.contentType,
      size: source.size,
      share: {
        isPublic: source.share.isPublic,
        readUIds: source.share.readUIds ? [...source.share.readUIds] : null,
        writeUIds: source.share.writeUIds ? [...source.share.writeUIds] : null,
      },
      articleNodeName: source.articleNodeName,
      articleNodeType: source.articleNodeType,
      articleSortOrder: source.articleSortOrder,
      url: source.url,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
      disableContextMenu: source.disableContextMenu,
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
   * ノードの表示用の名前を取得します。
   * @param node
   */
  protected getDisplayName(node: {
    path: StorageNode['path']
    name: StorageNode['name']
    articleNodeName: StorageNode['articleNodeName']
    articleNodeType: StorageNode['articleNodeType']
  }): string {
    if (this.storageType === 'article') {
      if (node.path === config.storage.article.assetsName) {
        return String(this.$tc('storage.asset', 2))
      }
    }
    if (node.articleNodeName) {
      return node.articleNodeName
    }
    return node.name
  }

  /**
   * ノードの表示用パスを取得します。
   * @param nodePath
   */
  protected getDisplayPath(nodePath: string): string {
    const hierarchicalNodes = this.storageLogic.getHierarchicalNodes(nodePath)
    return hierarchicalNodes.reduce((result, node) => {
      const name = node.articleNodeName ? node.articleNodeName : node.name
      return result ? `${result}/${name}` : name
    }, '')
  }

  /**
   * ノードのアイコンを取得します。
   * @param node
   */
  protected getNodeIcon(node: {
    path: StorageNode['path']
    nodeType: StorageNode['nodeType']
    articleNodeType: StorageNode['articleNodeType']
  }): string {
    // ページのストレージタイプが｢記事｣の場合
    if (this.storageType === 'article') {
      // 指定されたノードがアセットディレクトリの場合
      if (node.path === config.storage.article.assetsName) {
        return 'photo_library'
      }
    }

    return this.getNodeTypeIcon(node)
  }

  /**
   * ノードタイプの表示ラベルを取得します。
   * @param node
   */
  protected getNodeTypeLabel(node: { nodeType: StorageNode['nodeType']; articleNodeType: StorageNode['articleNodeType'] }): string {
    switch (node.nodeType) {
      case StorageNodeType.Dir: {
        if (node.articleNodeType) {
          return StorageArticleNodeType.getLabel(node.articleNodeType)
        }
        return StorageNodeType.getLabel(node.nodeType)
      }
      case StorageNodeType.File: {
        return StorageNodeType.getLabel(node.nodeType)
      }
      default: {
        return ''
      }
    }
  }

  /**
   * ノードタイプのアイコンを取得します。
   * @param node
   */
  protected getNodeTypeIcon(node: { nodeType: StorageNode['nodeType']; articleNodeType: StorageNode['articleNodeType'] }): string {
    if (node.articleNodeType) {
      return StorageArticleNodeType.getIcon(node.articleNodeType)
    } else {
      return StorageNodeType.getIcon(node.nodeType)
    }
  }

  /**
   * 画面に通知バーを表示します。
   * @param type
   * @param message
   */
  protected showNotification(type: 'error' | 'warning', message: string): void {
    this.$q.notify({
      icon: type === 'error' ? 'error' : 'warning',
      position: 'bottom-left',
      message,
      timeout: 0,
      color: type === 'error' ? 'red-9' : 'grey-9',
      actions: [{ icon: 'close', color: 'white' }],
    })
  }

  /**
   * ルートノードのツリーノードデータを作成します。
   */
  protected createRootNodeData(): StorageTreeNodeData {
    return createRootNodeData(this.storageType)
  }

  /**
   * 指定されたノードが｢アセットディレクトリ｣か否かを取得します。
   * @param node_or_nodePath
   */
  protected isAssetsDir(node_or_nodePath: { path: string } | string): boolean {
    if (this.storageType !== 'article') return false
    const node = this.m_getStorageNode(node_or_nodePath)
    if (!node) return false

    return node.path === config.storage.article.assetsName
  }

  /**
   * 指定されたノードが｢リストバンドル｣か否かを取得します。
   * @param node_or_nodePath
   */
  protected isListBundle(node_or_nodePath: { path: string } | string): boolean {
    if (this.storageType !== 'article') return false
    const node = this.m_getStorageNode(node_or_nodePath)
    if (!node) return false
    return node.articleNodeType === StorageArticleNodeType.ListBundle
  }

  /**
   * 指定されたノードが｢カテゴリバンドル｣か否かを取得します。
   * @param node_or_nodePath
   */
  protected isCategoryBundle(node_or_nodePath: { path: string } | string): boolean {
    if (this.storageType !== 'article') return false
    const node = this.m_getStorageNode(node_or_nodePath)
    if (!node) return false
    return node.articleNodeType === StorageArticleNodeType.CategoryBundle
  }

  /**
   * 指定されたノードが｢カテゴリ｣か否かを取得します。
   * @param node_or_nodePath
   */
  protected isCategory(node_or_nodePath: { path: string } | string): boolean {
    if (this.storageType !== 'article') return false
    const node = this.m_getStorageNode(node_or_nodePath)
    if (!node) return false
    return node.articleNodeType === StorageArticleNodeType.Category
  }

  /**
   * 指定されたノードが｢記事｣か否かを取得します。
   * @param node_or_nodePath
   */
  protected isArticle(node_or_nodePath: { path: string } | string): boolean {
    if (this.storageType !== 'article') return false
    const node = this.m_getStorageNode(node_or_nodePath)
    if (!node) return false
    return node.articleNodeType === StorageArticleNodeType.Article
  }

  /**
   * 指定されたノードが｢記事ファイル｣か否かを取得します。
   * @param node_or_nodePath
   */
  protected isArticleFile(node_or_nodePath: { path: string } | string): boolean {
    if (this.storageType !== 'article') return false
    const node = this.m_getStorageNode(node_or_nodePath)
    if (!node) return false

    const parentPath = removeStartDirChars(path.dirname(node.path))
    if (!parentPath) return false
    const parent = this.storageLogic.getNode({ path: parentPath })
    if (!parent) return false

    return parent.articleNodeType === StorageArticleNodeType.Article && node.name === config.storage.article.fileName
  }

  /**
   * 指定されたノードが｢記事｣の子孫か否かを取得します。
   * @param node_or_nodePath
   */
  protected isArticleDescendant(node_or_nodePath: { path: string } | string): boolean {
    if (this.storageType !== 'article') return false
    const node = this.m_getStorageNode(node_or_nodePath)
    if (!node) return false

    const parentPath = removeStartDirChars(path.dirname(node.path))
    if (!parentPath) return false

    const existsArticle = (nodePath: string) => {
      const parentPath = removeStartDirChars(path.dirname(nodePath))
      if (!parentPath) return false
      const parentNode = this.storageLogic.getNode({ path: parentPath })
      if (!parentNode) return false

      if (parentNode.articleNodeType === StorageArticleNodeType.Article) {
        return true
      } else {
        return existsArticle(parentPath)
      }
    }

    return existsArticle(node.path)
  }

  private m_getStorageNode(node_or_nodePath: { path: string } | string): StorageNode | undefined {
    if (!node_or_nodePath) return undefined

    let nodePath: string
    if (typeof node_or_nodePath === 'string') {
      nodePath = node_or_nodePath
    } else {
      nodePath = node_or_nodePath.path
    }

    return this.storageLogic.getNode({ path: nodePath })
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
        rootNode: CompTreeViewUtils.newNode<StorageTreeNode>(createRootNodeData(storageType)),
      },
    }) as StoragePageStore
    StoragePageStore.dict[storageType] = pageStore
  }

  static unregister(storageType: StorageType): void {
    const pageStore = StoragePageStore.get(storageType)
    if (!pageStore) return

    pageStore.page = null as any
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

  @Watch('$logic.auth.isSignedIn')
  private m_isSignedInOnChange(newValue: boolean, oldValue: boolean) {
    const isPageActive = Boolean(this.page)
    // ページが非アクティブな状態でサインアウトされた場合、対象のストレージページデータを削除する
    // ※ページが非アクティブな状態とは、ストレージタイプとひも付くページが表示されていない状態であり、
    //   またツリービューも破棄されていることを意味する。
    if (!isPageActive && !this.$logic.auth.isSignedIn) {
      const pageStore = StoragePageStore.get(this.storageType)
      if (pageStore) {
        delete StoragePageStore.dict[this.storageType]
        pageStore.rootNode.$destroy()
        pageStore.$destroy()
      }
    }
  }
}

/**
 * ルートノードのツリーノードデータを作成します。
 * @param storageType
 */
function createRootNodeData(storageType: StorageType): StorageTreeNodeData {
  let label: string
  let icon: string
  switch (storageType) {
    case 'app':
      label = String(i18n.t('storage.appRootName'))
      icon = 'storage'
      break
    case 'user':
      label = String(i18n.t('storage.userRootName'))
      icon = 'storage'
      break
    case 'article':
      label = String(i18n.t('storage.articleRootName'))
      icon = 'home'
      break
  }

  const rootNodeData: StorageTreeNodeData = {
    nodeClass: require('./storage-tree-node.vue').default,
    storageType,
    label,
    value: '',
    icon,
    opened: false,
    lazy: false,
    sortFunc: StorageLogic.childrenSortFunc,
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
    articleNodeName: null,
    articleNodeType: null,
    articleSortOrder: null,
    url: '',
    createdAt: dayjs(0),
    updatedAt: dayjs(0),
    disableContextMenu: false,
  }

  return rootNodeData
}

//========================================================================
//
//  Exports
//
//========================================================================

export { StoragePageMixin, StoragePageStore }
