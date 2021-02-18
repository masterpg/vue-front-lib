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
  let instance: APIContainer

  export function useAPI(apis?: APIContainer): APIContainer {
    instance = apis ?? instance ?? newRawInstance()
    return instance
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
//  Export
//
//========================================================================

const { useAPI } = APIContainer
export { APIContainer, useAPI }
