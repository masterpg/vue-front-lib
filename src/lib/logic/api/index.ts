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
  IdToken,
  LibAPIContainer,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  StorageNodeType,
  StoragePaginationOptionsInput,
  StoragePaginationResult,
  TimestampEntity,
  UserClaims,
  UserIdClaims,
} from './base'
export { BaseGQLAPIContainer } from './gql'
export { BaseRESTAPIContainer } from './rest'

export { api, setAPI }
