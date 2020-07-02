import { AppAPIContainer } from './base'
import { AppGQLAPIContainer } from './gql'
import { AppRESTAPIContainer } from './rest'
import { setAPI } from '@/lib'

//========================================================================
//
//  Implementation
//
//========================================================================

let apiType: 'gql' | 'rest' = 'gql'

let gqlAPI: AppGQLAPIContainer

let restAPI: AppRESTAPIContainer

let api: AppAPIContainer

function initAPI(params?: { apiType: 'gql' | 'rest'; api: AppAPIContainer }): void {
  if (!params) {
    setAPIType(apiType)
    return
  }

  apiType = params.apiType
  api = params.api
  setAPI(api)
}

function getAPIType() {
  return apiType
}

function setAPIType(value: 'gql' | 'rest') {
  apiType = value
  if (apiType === 'gql') {
    api = gqlAPI ? gqlAPI : new AppGQLAPIContainer()
  } else {
    api = restAPI ? restAPI : new AppRESTAPIContainer()
  }
  setAPI(api)
}

//========================================================================
//
//  Exports
//
//========================================================================

export { api, initAPI, getAPIType, setAPIType }
export { CartItemAddInput, CartItemEditResponse, CartItemUpdateInput } from './base'
