import { AppStorageLogic, ArticleStorageLogic, ArticleStorageLogicImpl, StorageLogic, UserStorageLogic } from '@/app/logic/modules/storage'
import { AuthLogic, AuthLogicImpl } from '@/app/logic/modules/auth'
import { ShopLogic, ShopLogicImpl } from '@/app/logic/modules/shop'
import { getAPIType, setAPIType } from '@/app/logic/api'
import { Component } from 'vue-property-decorator'
import Vue from 'vue'

//========================================================================
//
//  Interfaces
//
//========================================================================

export interface LogicContainer {
  readonly appStorage: StorageLogic
  readonly userStorage: StorageLogic
  readonly articleStorage: ArticleStorageLogic
  readonly auth: AuthLogic
  readonly shop: ShopLogic
  apiType: 'gql' | 'rest'
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class LogicContainerImpl extends Vue implements LogicContainer {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor() {
    super()

    this.appStorage = this.newAppStorageLogic()
    this.userStorage = this.newUserStorageLogic(this.appStorage as AppStorageLogic)
    this.articleStorage = this.newArticleStorageLogic(this.appStorage as AppStorageLogic)
    this.auth = this.newAuthLogic()
    this.shop = new ShopLogicImpl()
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  readonly appStorage: StorageLogic

  readonly userStorage: StorageLogic

  readonly articleStorage: ArticleStorageLogic

  readonly auth: AuthLogic

  readonly shop: ShopLogic

  private m_apiType = getAPIType()

  get apiType(): 'gql' | 'rest' {
    return this.m_apiType
  }

  set apiType(value: 'gql' | 'rest') {
    setAPIType(value)
    this.m_apiType = value
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected newAppStorageLogic(): StorageLogic {
    return new AppStorageLogic()
  }

  protected newUserStorageLogic(appStorage: AppStorageLogic): StorageLogic {
    const userStorage = new UserStorageLogic()
    userStorage.init(appStorage)
    return userStorage
  }

  protected newArticleStorageLogic(appStorage: AppStorageLogic): ArticleStorageLogic {
    const articleStorage = new ArticleStorageLogicImpl()
    articleStorage.init(appStorage)
    return articleStorage
  }

  protected newAuthLogic(): AuthLogic {
    return new AuthLogicImpl()
  }
}

let logic: LogicContainer

function initLogic(logicContainer?: LogicContainer): void {
  logic = logicContainer ? logicContainer : new LogicContainerImpl()

  Object.defineProperty(Vue.prototype, '$logic', {
    value: logic,
    writable: false,
    configurable: true,
  })
}

//========================================================================
//
//  Exports
//
//========================================================================

export { logic, initLogic, LogicContainerImpl }
export * from '@/app/logic/types'
export * from '@/app/logic/modules/shop'
export { initAPI } from '@/app/logic/api'
export { initStore } from '@/app/logic/store'
export { AuthLogic, AuthProviderType } from '@/app/logic/modules/auth'
export {
  ArticleStorageLogic,
  StorageDownloader,
  StorageFileUploader,
  StorageLogic,
  StorageType,
  StorageUploader,
  StorageUrlUploadManager,
  SubStorageLogic,
} from '@/app/logic/modules/storage'
