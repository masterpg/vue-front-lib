import { AppAPIContainer } from '@/example/logic/api/types'
import { AppGQLAPIContainer } from '@/example/logic/api/gql'
import { AppRESTAPIContainer } from '@/example/logic/api/rest'
import { setAPI } from '@/lib'

//========================================================================
//
//  Internal
//
//========================================================================

let apiType: 'gql' | 'rest' = 'gql'

let gqlAPI: AppGQLAPIContainer

let restAPI: AppRESTAPIContainer

//========================================================================
//
//  Exports
//
//========================================================================

export let api: AppAPIContainer

export function initAPI(params?: { apiType: 'gql' | 'rest'; api: AppAPIContainer }): void {
  if (!params) {
    setAPIType(apiType)
    return
  }

  apiType = params.apiType
  api = params.api
  setAPI(api)
}

export function getAPIType() {
  return apiType
}

export function setAPIType(value: 'gql' | 'rest') {
  apiType = value
  if (apiType === 'gql') {
    api = gqlAPI ? gqlAPI : new AppGQLAPIContainer()
  } else {
    api = restAPI ? restAPI : new AppRESTAPIContainer()
  }
  setAPI(api)
}

export * from '@/example/logic/api/types'
