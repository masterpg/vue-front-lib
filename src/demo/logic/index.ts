import { DemoAPIContainer, createAPI, provideAPI } from '@/demo/logic/api'
import { DemoStoreContainer, createStore, provideStore } from '@/demo/logic/store'
import { InternalLogic, createInternalLogic, provideInternalLogic } from '@/app/logic/modules/internal'
import { LogicContainer, LogicKey, createLogic as _createLogic, validateLogicProvided } from '@/app/logic'
import { ShopLogic, createShopLogic } from '@/demo/logic/modules/shop'
import { inject, provide } from '@vue/composition-api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface DemoLogicContainer extends LogicContainer {
  readonly shop: ShopLogic
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createLogic(): DemoLogicContainer {
  const base = _createLogic()

  return {
    ...base,
    shop: createShopLogic(),
  }
}

function provideLogic(options?: {
  api?: DemoAPIContainer | typeof createAPI
  store?: DemoStoreContainer | typeof createStore
  internal?: InternalLogic | typeof createInternalLogic
  logic?: DemoLogicContainer | typeof createLogic
}): void {
  provideAPI(options?.api)
  provideStore(options?.store)
  provideInternalLogic(options?.internal)

  let instance: DemoLogicContainer
  if (!options?.logic) {
    instance = createLogic()
  } else {
    instance = typeof options.logic === 'function' ? options.logic() : options.logic
  }
  provide(LogicKey, instance)
}

function injectLogic(): DemoLogicContainer {
  validateLogicProvided()
  return inject(LogicKey)! as DemoLogicContainer
}

//========================================================================
//
//  Export
//
//========================================================================

export { DemoLogicContainer, LogicKey, createLogic, injectLogic, provideLogic, validateLogicProvided }
export * from '@/demo/logic/base'
