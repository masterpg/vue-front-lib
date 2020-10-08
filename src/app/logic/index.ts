import { APIContainer, createAPI, provideAPI } from '@/app/logic/api'
import { AuthLogic, createAuthLogic } from '@/app/logic/modules/auth'
import { InjectionKey, inject, provide } from '@vue/composition-api'
import { InternalLogic, createInternalLogic, provideInternalLogic } from '@/app/logic/modules/internal'
import { ShopLogic, createShopLogic } from '@/app/logic/modules/shop'
import { StoreContainer, createStore, provideStore } from '@/app/logic/store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface LogicContainer {
  readonly auth: AuthLogic
  readonly shop: ShopLogic
}

//========================================================================
//
//  Implementation
//
//========================================================================

const LogicKey: InjectionKey<LogicContainer> = Symbol('Logic')

function createLogic(): LogicContainer {
  return {
    auth: createAuthLogic(),
    shop: createShopLogic(),
  }
}

function provideLogic(options?: {
  api?: APIContainer | typeof createAPI
  store?: StoreContainer | typeof createStore
  internal?: InternalLogic | typeof createInternalLogic
  logic?: LogicContainer | typeof createLogic
}): void {
  provideAPI({ api: options?.api })
  provideStore(options?.store)
  provideInternalLogic(options?.internal)

  let instance: LogicContainer
  if (!options?.logic) {
    instance = createLogic()
  } else {
    instance = typeof options.logic === 'function' ? options.logic() : options.logic
  }
  provide(LogicKey, instance)
}

function injectLogic(): LogicContainer {
  validateLogicProvided()
  return inject(LogicKey)!
}

function validateLogicProvided(): void {
  if (!inject(LogicKey)) {
    throw new Error(`${LogicKey.description} is not provided`)
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export * from '@/app/logic/types'
export { StoreUtil } from '@/app/logic/store'
export { LogicContainer, LogicKey, provideLogic, injectLogic, validateLogicProvided }
