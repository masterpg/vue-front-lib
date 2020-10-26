import { DemoStoreContainer } from '@/demo/logic/store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TestDemoStoreContainer extends DemoStoreContainer {}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TestDemoStoreContainer {
  export function newInstance(): TestDemoStoreContainer {
    const base = DemoStoreContainer.newRawInstance()
    return {
      ...base,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestDemoStoreContainer }
