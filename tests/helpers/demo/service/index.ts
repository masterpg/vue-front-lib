import { DemoServiceContainer } from '@/demo/services'
import { InternalService } from '@/app/services/modules/internal'
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
  apis: TestDemoAPIContainer
  stores: TestDemoStoreContainer
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
    const apis = TestDemoAPIContainer.newInstance()
    const stores = TestDemoStoreContainer.newInstance()
    const internal = InternalService.newInstance()
    const dependency = { apis, stores, internal }

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
