import { GQLAPIContainer, GQLAPIContainerImpl, injectGQLAPI, provideGQLAPI } from '@/app/logic/api/gql'
import { InjectionKey, inject, provide } from '@vue/composition-api'
import { RESTAPIContainer, RESTAPIContainerImpl, injectRESTAPI, provideRESTAPI } from '@/app/logic/api/rest'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface APIContainer extends GQLAPIContainer, RESTAPIContainer {}

interface APIContainerImpl extends APIContainer {
  gql: GQLAPIContainerImpl
  rest: RESTAPIContainerImpl
}

//========================================================================
//
//  Implementation
//
//========================================================================

const APIKey: InjectionKey<APIContainer> = Symbol('APIContainer')

function createAPI(): APIContainer {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const gql = injectGQLAPI()
  const rest = injectRESTAPI()

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    ...gql,
    ...rest,
    gql,
    rest,
  } as APIContainerImpl
}

function provideAPI(api?: APIContainer | typeof createAPI): void {
  provideGQLAPI()
  provideRESTAPI()

  let instance: APIContainer
  if (!api) {
    instance = createAPI()
  } else {
    instance = typeof api === 'function' ? api() : api
  }
  provide(APIKey, instance)
}

function injectAPI(): APIContainer {
  validateAPIProvided()
  return inject(APIKey)!
}

function validateAPIProvided(): void {
  const value = inject(APIKey)
  if (!value) {
    throw new Error(`${APIKey.description} is not provided`)
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { APIContainer, APIContainerImpl, APIKey, createAPI, provideAPI, injectAPI, validateAPIProvided }
