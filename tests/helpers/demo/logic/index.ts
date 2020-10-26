import { DemoLogicContainer } from '@/demo/logic'
import { InternalLogic } from '@/app/logic/modules/internal'
import { LogicDependency } from '@/app/logic'
import { TestDemoAPIContainer } from './api'
import { TestDemoStoreContainer } from './store'
import { TestLogicContainer } from '../../app/logic'

//========================================================================
//
//  Interfaces
//
//========================================================================

type TestDemoLogicContainer = DemoLogicContainer & TestLogicContainer

interface TestDemoLogicDependency extends LogicDependency {
  api: TestDemoAPIContainer
  store: TestDemoStoreContainer
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TestDemoLogicContainer {
  export function newInstance(): TestDemoLogicContainer & { readonly dependency: TestDemoLogicDependency } {
    const api = TestDemoAPIContainer.newInstance()
    const store = TestDemoStoreContainer.newInstance()
    const internal = InternalLogic.newInstance({ api, store })
    const dependency = { api, store, internal }

    const base = DemoLogicContainer.newRawInstance(dependency)

    return {
      ...base,
      dependency,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestDemoLogicContainer }
export * from './api'
export * from './store'
