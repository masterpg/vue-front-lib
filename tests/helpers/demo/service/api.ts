import { DemoAPIContainer } from '@/demo/service/api'
import { TestAPIContainer } from '../../app'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TestDemoAPIContainer extends DemoAPIContainer, TestAPIContainer {}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TestDemoAPIContainer {
  export function newInstance(): TestDemoAPIContainer {
    const api = DemoAPIContainer.newRawInstance()
    return TestAPIContainer.mix(api)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestDemoAPIContainer }
