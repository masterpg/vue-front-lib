import { GQLAPIClient } from '@/app/logic/api/gql/client'
import { GQLAPIContainer } from '@/app/logic/api/gql'
import { RESTAPIClient } from '@/app/logic/api/rest/client'
import { RESTAPIContainer } from '@/app/logic/api/rest'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface APIContainer extends GQLAPIContainer, RESTAPIContainer {}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace APIContainer {
  export function newInstance(): APIContainer {
    return newRawInstance()
  }

  export function newRawInstance() {
    const gqlClient = GQLAPIClient.newInstance()
    const restClient = RESTAPIClient.newInstance()

    const gql = GQLAPIContainer.newRawInstance(gqlClient)
    const rest = RESTAPIContainer.newRawInstance(restClient)

    return {
      ...gql,
      ...rest,
      gql: { client: gqlClient },
      rest: { client: restClient },
    }
  }
}

//========================================================================
//
//  Dependency Injection
//
//========================================================================

let instance: APIContainer

function provideAPI(api: APIContainer): void {
  instance = api
}

function injectAPI(): APIContainer {
  if (!instance) {
    throw new Error(`'APIContainer' is not provided`)
  }
  return instance
}

//========================================================================
//
//  Export
//
//========================================================================

export { APIContainer, provideAPI, injectAPI }
