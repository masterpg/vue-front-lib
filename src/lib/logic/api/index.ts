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

export { APIEntity, APIStorageNode, AppConfigResponse, AuthDataResult, LibAPIContainer, RawTimestampEntity, ToRawTimestampEntity } from './base'
export { BaseGQLAPIContainer, RawAuthDataResult, RawPublicProfile, RawUser } from './gql'
export { BaseRESTAPIContainer } from './rest'
export { api, setAPI }
