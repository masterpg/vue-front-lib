import { DemoServiceContainer } from '@/demo/services'
import { InternalServiceContainer } from '@/app/services/modules/internal'
import { TestDemoAPIContainer } from './apis'
import { TestDemoStoreContainer } from './stores'
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
  internal: InternalServiceContainer
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
    const internal = InternalServiceContainer.newRawInstance()
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
export * from './apis'
export * from './stores'
