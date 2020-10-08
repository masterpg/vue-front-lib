import { APIContainer, APIContainerImpl, createAPI } from '@/logic/api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TestAPIContainer extends APIContainer {
  putTestData(testData: any): Promise<void>
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createTestAPI(): TestAPIContainer {
  const api = createAPI() as APIContainerImpl

  const putTestData: TestAPIContainer['putTestData'] = async testData => {
    await api.client.put('testData', testData)
  }

  return {
    ...api,
    putTestData,
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestAPIContainer, createTestAPI }
