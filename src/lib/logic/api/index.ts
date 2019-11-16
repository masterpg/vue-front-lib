import { BaseAPIContainer } from './types'

//========================================================================
//
//  Exports
//
//========================================================================

export let api: BaseAPIContainer

export function setAPI(value: BaseAPIContainer): void {
  api = value
}

export { APIStorageNode, APIStorageNodeType, BaseAPIContainer } from './types'

export { BaseGQLAPIContainer } from './gql'

export { BaseRESTAPIContainer } from './rest'
