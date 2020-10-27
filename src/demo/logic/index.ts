import { LogicContainer, injectLogic as _injectLogic, provideLogic as _provideLogic } from '@/app/logic'
import { DemoAPIContainer } from '@/demo/logic/api'
import { DemoStoreContainer } from '@/demo/logic/store'
import { InternalLogic } from '@/app/logic/modules/internal'
import { ShopLogic } from '@/demo/logic/modules/shop'

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

namespace DemoLogicContainer {
  export function newInstance(): DemoLogicContainer {
    return newRawInstance()
  }

  export function newRawInstance(options?: { api?: DemoAPIContainer; store?: DemoStoreContainer; internal?: InternalLogic }) {
    const api = options?.api ?? DemoAPIContainer.newInstance()
    const store = options?.store ?? DemoStoreContainer.newInstance()
    const internal = options?.internal ?? InternalLogic.newInstance()
    const dependency = { api, store, internal }

    const base = LogicContainer.newRawInstance(dependency)

    return {
      ...base,
      shop: ShopLogic.newRawInstance(),
    }
  }
}

//========================================================================
//
//  Dependency Injection
//
//========================================================================

function provideLogic(instance?: DemoLogicContainer): void {
  instance = instance ?? DemoLogicContainer.newInstance()
  _provideLogic(instance)
}

function injectLogic(): DemoLogicContainer {
  return _injectLogic() as DemoLogicContainer
}

//========================================================================
//
//  Export
//
//========================================================================

export { DemoLogicContainer, injectLogic, provideLogic }
export * from '@/demo/logic/base'
