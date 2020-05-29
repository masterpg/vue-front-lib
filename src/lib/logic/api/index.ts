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

export {
  APIEntity,
  APIStorageNode,
  APIStoragePaginationResult,
  APITimestampEntity,
  AppConfigResponse,
  AuthDataResult,
  AuthStatus,
  IdToken,
  LibAPIContainer,
  PublicProfile,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  StorageNodeType,
  StoragePaginationOptionsInput,
  StoragePaginationResult,
  TimestampEntity,
  ToAPITimestampEntity,
  UserInfo,
  UserClaims,
  UserIdClaims,
  UserInfoInput,
} from './base'
export { BaseGQLAPIContainer, APIAuthDataResult, APIPublicProfile, APIUser } from './gql'
export { BaseRESTAPIContainer } from './rest'
export { api, setAPI }
