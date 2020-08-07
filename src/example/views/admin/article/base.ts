import { ArticleStorageLogic, StorageNodeType } from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import { StorageRoute, router } from '@/example/router'
import ArticleAdminPage from './article-admin-page.vue'
import { StorageNodePopupMenuItem } from '../../base/storage'
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
}

@Component
class ArticleAdminPageStore extends Vue {
  private static m_instance: ArticleAdminPageStore

  static getInstance(): ArticleAdminPageStore {
    return this.m_instance
  }

  static register(page: ArticleAdminPage): void {
    // プログラム的にコンポーネントのインスタンスを生成
    // https://css-tricks.com/creating-vue-js-component-instances-programmatically/
    const ComponentClass = Vue.extend(ArticleAdminPageStore)
    this.m_instance = new ComponentClass({
      propsData: { page },
    }) as ArticleAdminPageStore
  }

  @Prop({ required: true })
  page!: ArticleAdminPage

  isInitialPull = false

  isPageActive = false

  get rootNode(): ArticleAdminRootNodeData {
    return {
      name: String(i18n.t('articleAdmin.articleRootName')),
      path: '',
      nodeType: StorageNodeType.Dir,
    }
  }
}

//--------------------------------------------------
//  NodeMenu
//--------------------------------------------------

class ArticleAdminNodeMenuTypeImpl {
  readonly createListBundle: StorageNodePopupMenuItem = new (class {
    readonly type = 'createListBundle'
    get label(): string {
      return String(i18n.t('common.createSth', { sth: i18n.t('articleAdmin.listBundle') }))
    }
  })()

  readonly createCategoryBundle: StorageNodePopupMenuItem = new (class {
    readonly type = 'createCategoryBundle'
    get label(): string {
      return String(i18n.t('common.createSth', { sth: i18n.t('articleAdmin.categoryBundle') }))
    }
  })()
}

const ArticleAdminNodeMenuType = new ArticleAdminNodeMenuTypeImpl()

//========================================================================
//
//  Exports
//
//========================================================================

export { ArticleAdminPageMixin, ArticleAdminPageStore, ArticleAdminNodeMenuType }
