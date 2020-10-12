import { InjectionKey, inject, provide } from '@vue/composition-api'
import { RESTAPIClient, createRESTAPIClient, injectRESTAPIClient, provideRESTAPIClient } from '@/app/logic/api/rest/client'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface RESTAPIContainer {}

interface RESTAPIContainerImpl extends RESTAPIContainer {
  client: RESTAPIClient
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createRESTAPI(): RESTAPIContainer {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const client = injectRESTAPIClient()

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    client,
  } as RESTAPIContainerImpl
}

const RESTAPIKey: InjectionKey<RESTAPIContainer> = Symbol('RESTAPIContainer')

function provideRESTAPI(options?: { api?: RESTAPIContainer | typeof createRESTAPI; client?: RESTAPIClient | typeof createRESTAPIClient }): void {
  provideRESTAPIClient(options?.client)

  let instance: RESTAPIContainer
  if (!options?.api) {
    instance = createRESTAPI()
  } else {
    instance = typeof options.api === 'function' ? options.api() : options.api
  }
  provide(RESTAPIKey, instance)
}

function injectRESTAPI(): RESTAPIContainer {
  validateRESTAPIProvided()
  return inject(RESTAPIKey)!
}

function validateRESTAPIProvided(): void {
  const value = inject(RESTAPIKey)
  if (!value) {
    throw new Error(`${RESTAPIKey.description} is not provided`)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { RESTAPIContainer, RESTAPIContainerImpl, RESTAPIKey, createRESTAPI, injectRESTAPI, provideRESTAPI, validateRESTAPIProvided }
