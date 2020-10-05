import { LibAPIContainer } from './base'

//========================================================================
//
//  Implementation
//
//========================================================================

let api: LibAPIContainer

function setAPI(value: LibAPIContainer): void {
  api = value
}

//========================================================================
//
//  Exports
//
//========================================================================

export { APIStorageNode, AppConfigResponse, AuthDataResult, LibAPIContainer, RawEntity, RawTimestampEntity, ToRawTimestampEntity } from './base'
export { BaseGQLAPIContainer, RawAuthDataResult, RawPublicProfile, RawUser } from './gql'
export { BaseRESTAPIContainer } from './rest'
export { api, setAPI }
