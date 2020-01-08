import { BaseLogicContainer, setLogic } from '@/lib'
import { LogicContainer, ShopLogic } from '@/example/logic/types'
import { getAPIType, setAPIType } from '@/example/logic/api'
import { Component } from 'vue-property-decorator'
import { ShopLogicImpl } from '@/example/logic/modules/shop'
import Vue from 'vue'

//========================================================================
//
//  Internal
//
//========================================================================

@Component
export class LogicContainerImpl extends BaseLogicContainer implements LogicContainer {
  private m_apiType = getAPIType()

  get apiType(): 'gql' | 'rest' {
    return this.m_apiType
  }

  set apiType(value: 'gql' | 'rest') {
    setAPIType(value)
    this.m_apiType = value
  }

  readonly shop: ShopLogic = new ShopLogicImpl()
}

//========================================================================
//
//  Exports
//
//========================================================================

export let logic: LogicContainer

export function initLogic(logicContainer?: LogicContainer): void {
  logic = logicContainer ? logicContainer : new LogicContainerImpl()
  setLogic(logic)

  Object.defineProperty(Vue.prototype, '$logic', {
    value: logic,
    writable: false,
    configurable: true,
  })
}

export * from '@/example/logic/types'
