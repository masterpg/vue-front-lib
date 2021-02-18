import { DemoAPIContainer } from '@/demo/services/apis'
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
    const apis = DemoAPIContainer.newRawInstance()
    return TestAPIContainer.mix(apis)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestDemoAPIContainer }
