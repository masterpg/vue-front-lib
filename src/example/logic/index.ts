import { BaseLogicContainer, LibLogicContainer, StorageLogic, setLogic } from '@/lib'
import { ShopLogic, ShopLogicImpl } from './modules/shop'
import { getAPIType, setAPIType } from './api'
import { Component } from 'vue-property-decorator'
import { DocsStorageLogic } from './modules/storage'
import Vue from 'vue'

//========================================================================
//
//  Interfaces
//
//========================================================================

export interface LogicContainer extends LibLogicContainer {
  apiType: 'gql' | 'rest'

  readonly docsStorage: StorageLogic

  readonly shop: ShopLogic
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class LogicContainerImpl extends BaseLogicContainer implements LogicContainer {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor() {
    super()

    this.docsStorage = this.newDocsStorageLogic(this.appStorage)
    this.shop = new ShopLogicImpl()
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_apiType = getAPIType()

  get apiType(): 'gql' | 'rest' {
    return this.m_apiType
  }

  set apiType(value: 'gql' | 'rest') {
    setAPIType(value)
    this.m_apiType = value
  }

  readonly docsStorage: StorageLogic

  readonly shop: ShopLogic

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected newDocsStorageLogic(appStorage: StorageLogic): StorageLogic {
    const docsStorage = new DocsStorageLogic()
    docsStorage.init(appStorage)
    return docsStorage
  }
}

let logic: LogicContainer

function initLogic(logicContainer?: LogicContainer): void {
  logic = logicContainer ? logicContainer : new LogicContainerImpl()
  setLogic(logic)

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

export * from './types'
export * from './modules/shop'
export { initAPI } from './api'
export { initStore } from './store'
export { logic, initLogic, LogicContainerImpl }
