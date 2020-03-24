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
  GetStorageOptionsInput,
  GetStorageResult,
  LibAPIContainer,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeShareSettingsInput,
  StorageNodeType,
} from './types'

export { BaseGQLAPIContainer } from './gql'

export { BaseRESTAPIContainer } from './rest'
