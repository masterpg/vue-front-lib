import { DemoAPIContainerImpl, injectAPI, provideAPI } from '@/demo/logic/api'
import { TestAPIContainer, setupTestAPI } from '../../app'
import { injectConfig } from '@/app/config'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface DemoTestAPIContainer extends DemoAPIContainerImpl, TestAPIContainer {}

//========================================================================
//
//  Implementation
//
//========================================================================

function createTestAPI(): DemoTestAPIContainer {
  provideAPI()
  const config = injectConfig()
  const api = injectAPI() as DemoAPIContainerImpl
  return setupTestAPI({ config, api })
}

//========================================================================
//
//  Exports
//
//========================================================================

export { DemoTestAPIContainer, createTestAPI }
