import { GQLAPIContainer } from '@/app/services/apis/gql'
import { RESTAPIContainer } from '@/app/services/apis/rest'

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

function provideAPI(apis: APIContainer): void {
  instance = apis
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
