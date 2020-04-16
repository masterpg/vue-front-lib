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

export {
  APIResponseStorageNode,
  LibAPIContainer,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  StorageNodeType,
  StoragePaginationOptionsInput,
  StoragePaginationResult,
} from './types'

export { BaseGQLAPIContainer } from './gql'

export { BaseRESTAPIContainer } from './rest'
