import { AppAPIContainer } from '@/app/logic/api/base'
import { AppGQLAPIContainer } from '@/app/logic/api/gql'
import { AppRESTAPIContainer } from '@/app/logic/api/rest'

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
}

//========================================================================
//
//  Exports
//
//========================================================================

export { AppAPIContainer, api, getAPIType, initAPI, setAPIType }
export { APIStorageNode, AppConfigResponse, AuthDataResult, RawEntity, RawTimestampEntity, ToRawTimestampEntity } from '@/app/logic/api/base'
export { CartItemAddInput, CartItemEditResponse, CartItemUpdateInput } from '@/app/logic/api/base'
export { RawAuthDataResult, RawPublicProfile, RawUser } from '@/app/logic/api/gql'
