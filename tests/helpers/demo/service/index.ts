import { DemoServiceContainer } from '@/demo/services'
import { HelperContainer } from '@/app/services/helpers'
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
  helpers: HelperContainer
  stores: TestDemoStoreContainer
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
    const helpers = HelperContainer.newRawInstance()
    const stores = TestDemoStoreContainer.newInstance()
    const dependency = { apis, helpers, stores }

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
