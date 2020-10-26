import { LogicContainer, LogicKey, validateLogicProvided } from '@/app/logic'
import { inject, provide } from '@vue/composition-api'
import { DemoAPIContainer } from '@/demo/logic/api'
import { DemoLogicDependency } from '@/demo/logic/base'
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

  export function newRawInstance(options?: Partial<DemoLogicDependency>) {
    const api = options?.api ?? DemoAPIContainer.newInstance()
    const store = options?.store ?? DemoStoreContainer.newInstance()
    const internal = options?.internal ?? InternalLogic.newInstance({ api, store })
    const dependency = { api, store, internal }

    const base = LogicContainer.newRawInstance(dependency)

    return {
      ...base,
      shop: ShopLogic.newRawInstance(dependency),
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

export { DemoLogicContainer, LogicKey, injectLogic, provideLogic, validateLogicProvided }
export * from '@/demo/logic/base'
