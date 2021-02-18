import { RESTAPIClient } from '@/app/services/apis/rest/client'

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
