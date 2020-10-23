import { DemoAPIContainerImpl, injectAPI, provideAPI } from '@/demo/logic/api'
import { TestAPIContainer, setupTestAPI } from '../../app'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TestDemoAPIContainer extends DemoAPIContainerImpl, TestAPIContainer {}

//========================================================================
//
//  Implementation
//
//========================================================================

function createTestAPI(): TestDemoAPIContainer {
  provideAPI()
  const api = injectAPI() as DemoAPIContainerImpl
  return setupTestAPI(api)
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestDemoAPIContainer, createTestAPI }
