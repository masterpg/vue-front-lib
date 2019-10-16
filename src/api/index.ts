import { AppAPI } from '@/api/types'
import { GQLAppAPIImpl } from '@/api/gql'
import { RESTAppAPIImpl } from '@/api/rest'

let apiType: 'gql' | 'rest' = 'gql'
let gqlAPI: GQLAppAPIImpl
let restAPI: RESTAppAPIImpl

export let api: AppAPI

export function initAPI(appAPI?: AppAPI): void {
  if (appAPI) {
    api = appAPI
  } else {
    setAPIType(apiType)
  }
}

export function getAPIType() {
  return apiType
}

export function setAPIType(value: 'gql' | 'rest') {
  apiType = value
  if (apiType === 'gql') {
    api = gqlAPI ? gqlAPI : new GQLAppAPIImpl()
  } else {
    api = restAPI ? restAPI : new RESTAppAPIImpl()
  }
}

export * from '@/api/types'
