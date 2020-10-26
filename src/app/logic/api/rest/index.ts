import { RESTAPIClient } from '@/app/logic/api/rest/client'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface RESTAPIContainer {}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace RESTAPIContainer {
  export function newInstance(): RESTAPIContainer {
    return newRawInstance()
  }

  export function newRawInstance(client?: RESTAPIClient) {
    const c = client ?? RESTAPIClient.newInstance()

    return {}
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { RESTAPIContainer }
