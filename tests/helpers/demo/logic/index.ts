import { DemoLogicContainer } from '@/demo/logic'
import { InternalLogic } from '@/app/logic/modules/internal'
import { TestDemoAPIContainer } from './api'
import { TestDemoStoreContainer } from './store'
import { TestLogicContainer } from '../../app'

//========================================================================
//
//  Interfaces
//
//========================================================================

type TestDemoLogicContainer = DemoLogicContainer & TestLogicContainer

interface TestDemoLogicDependency {
  api: TestDemoAPIContainer
  store: TestDemoStoreContainer
  internal: InternalLogic
}

//========================================================================
//
//  Implementation
//
//========================================================================

// eslint-disable-next-line @typescript-eslint/no-redeclare
namespace TestDemoLogicContainer {
  export function newInstance(): TestDemoLogicContainer & { readonly dependency: TestDemoLogicDependency } {
    const api = TestDemoAPIContainer.newInstance()
    const store = TestDemoStoreContainer.newInstance()
    const internal = InternalLogic.newInstance()
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
