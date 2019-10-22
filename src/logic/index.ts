import { AuthLogic, Logic, ShopLogic, StorageLogic } from '@/logic/types'
import { StorageLogicImpl, StorageUploadManager } from '@/logic/modules/storage'
import { getAPIType, setAPIType } from '@/api'
import { AuthLogicImpl } from '@/logic/modules/auth'
import { Component } from 'vue-property-decorator'
import { ShopLogicImpl } from '@/logic/modules/shop'
import Vue from 'vue'

@Component
class LogicImpl extends Vue implements Logic {
  private m_apiType = getAPIType()

  get apiType(): 'gql' | 'rest' {
    return this.m_apiType
  }

  set apiType(value: 'gql' | 'rest') {
    setAPIType(value)
    this.m_apiType = value
  }

  readonly storage: StorageLogic = new StorageLogicImpl()

  readonly shop: ShopLogic = new ShopLogicImpl()

  readonly auth: AuthLogic = new AuthLogicImpl()
}

export let logic: Logic

export function initLogic(): void {
  logic = new LogicImpl()
  Object.defineProperty(Vue.prototype, '$logic', {
    value: logic,
    writable: false,
    configurable: true,
  })
}

export * from '@/logic/types'
export { StorageUploadManager }
