import { DemoServiceContainer } from '@/demo/service'
import { InternalService } from '@/app/service/modules/internal'
import { TestDemoAPIContainer } from './api'
import { TestDemoStoreContainer } from './store'
import { TestServiceContainer } from '../../app'

//========================================================================
//
//  Interfaces
//
//========================================================================

type TestDemoServiceContainer = DemoServiceContainer & TestServiceContainer

interface TestDemoServiceDependency {
  api: TestDemoAPIContainer
  store: TestDemoStoreContainer
  internal: InternalService
}

//========================================================================
//
//  Implementation
//
//========================================================================

// eslint-disable-next-line @typescript-eslint/no-redeclare
namespace TestDemoServiceContainer {
  export function newInstance(): TestDemoServiceContainer & { readonly dependency: TestDemoServiceDependency } {
    const api = TestDemoAPIContainer.newInstance()
    const store = TestDemoStoreContainer.newInstance()
    const internal = InternalService.newInstance()
    const dependency = { api, store, internal }

    const base = DemoServiceContainer.newRawInstance(dependency)

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

export { TestDemoServiceContainer }
export * from './api'
export * from './store'
