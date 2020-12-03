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

  export function newRawInstance() {
    return {}
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { RESTAPIContainer }
