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
  APIDocumentData,
  APIStorageNode,
  APIStoragePaginationResult,
  AppConfigResponse,
  DocumentData,
  LibAPIContainer,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  StorageNodeType,
  StoragePaginationOptionsInput,
  StoragePaginationResult,
} from './base'
export { BaseGQLAPIContainer } from './gql'
export { BaseRESTAPIContainer } from './rest'

export { api, setAPI }
