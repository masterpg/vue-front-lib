import { AuthLogic, HelloLogic, Logic, ShopLogic } from '@/logic/types'
import { AuthLogicImpl } from '@/logic/modules/auth'
import { HelloLogicImpl } from '@/logic/modules/hello'
import { ShopLogicImpl } from '@/logic/modules/shop'
import Vue from 'vue'

class LogicImpl implements Logic {
  readonly shop: ShopLogic = new ShopLogicImpl()
  readonly auth: AuthLogic = new AuthLogicImpl()
  readonly hello: HelloLogic = new HelloLogicImpl()
}

export let logic: Logic

export function initLogic(): void {
  logic = new LogicImpl()
  Object.defineProperty(Vue.prototype, '$logic', {
    value: logic,
    writable: false,
  })
}

export * from '@/logic/types'
