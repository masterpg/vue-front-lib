import { LibAPIContainer } from './types'

//========================================================================
//
//  Exports
//
//========================================================================

export let api: LibAPIContainer

export function setAPI(value: LibAPIContainer): void {
  api = value
}

export { APIStorageNode, APIStorageNodeType, LibAPIContainer } from './types'

export { BaseGQLAPIContainer } from './gql'

export { BaseRESTAPIContainer } from './rest'
