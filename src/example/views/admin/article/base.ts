import { ArticleStorageLogic, StorageNodeType } from '@/lib'
import { StorageRoute, router } from '@/example/router'
import ArticleAdminPage from './article-admin-page.vue'
import { Component } from 'vue-property-decorator'
import Vue from 'vue'
import { i18n } from '@/example/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ArticleAdminRootNodeData {
  name: string
  path: string
  nodeType: StorageNodeType
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class ArticleAdminPageMixin extends Vue {
  protected get storageLogic(): ArticleStorageLogic {
    return this.$logic.articleStorage
  }

  protected get storageRoute(): StorageRoute {
    return router.views.admin.article
  }

  get pageStore(): ArticleAdminPageStore {
    return ArticleAdminPageStore.getInstance()
  }

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
}

@Component
class ArticleAdminPageStore extends Vue {
  private static m_instance: ArticleAdminPageStore

  static getInstance(): ArticleAdminPageStore {
    return this.m_instance
  }

  static register(page: ArticleAdminPage): void {
    const pageStore = this.getInstance()
    if (pageStore) {
      pageStore.page = page
      return
    }

    // プログラム的にコンポーネントのインスタンスを生成
    // https://css-tricks.com/creating-vue-js-component-instances-programmatically/
    const ComponentClass = Vue.extend(ArticleAdminPageStore)
    this.m_instance = new ComponentClass({
      data: { page },
    }) as ArticleAdminPageStore
  }

  static unregister(): void {
    const pageStore = this.getInstance()
    if (!pageStore) return

    pageStore.page = null as any
  }

  page: ArticleAdminPage = null as any

  isInitialPull = false

  selectedDirPath = ''

  get isPageActive(): boolean {
    return Boolean(this.page)
  }

  get rootNode(): ArticleAdminRootNodeData {
    return {
      name: String(i18n.t('storage.articleRootName')),
      path: '',
      nodeType: StorageNodeType.Dir,
    }
  }
}

//--------------------------------------------------
//  NodeMenu
//--------------------------------------------------

interface ArticleAdminNodeActionType {
  readonly type: string
  readonly label: string
}

namespace ArticleAdminNodeActionType {
  export const createListBundle: ArticleAdminNodeActionType = new (class {
    readonly type = 'createListBundle'
    get label(): string {
      return String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.listBundle') }))
    }
  })()

  export const createCategoryBundle: ArticleAdminNodeActionType = new (class {
    readonly type = 'createCategoryBundle'
    get label(): string {
      return String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.categoryBundle') }))
    }
  })()

  export const createCategoryDir: ArticleAdminNodeActionType = new (class {
    readonly type = 'createCategoryDir'
    get label(): string {
      return String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.categoryDir') }))
    }
  })()

  export const createArticleDir: ArticleAdminNodeActionType = new (class {
    readonly type = 'createArticleDir'
    get label(): string {
      return String(i18n.t('common.createSth', { sth: i18n.t('article.nodeType.articleDir') }))
    }
  })()
}

//========================================================================
//
//  Exports
//
//========================================================================

export { ArticleAdminPageMixin, ArticleAdminPageStore, ArticleAdminNodeActionType }
