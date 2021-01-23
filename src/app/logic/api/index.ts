import { GQLAPIContainer } from '@/app/logic/api/gql'
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
    const gql = GQLAPIContainer.newRawInstance()
    const rest = RESTAPIContainer.newRawInstance()

    return {
      ...gql,
      ...rest,
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
