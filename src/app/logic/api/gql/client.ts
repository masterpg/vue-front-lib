import 'unfetch/polyfill'
import { ApolloClient, ApolloQueryResult, MutationOptions, OperationVariables, QueryOptions } from 'apollo-client'
import { ApolloLink, FetchResult } from 'apollo-link'
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory'
import { InjectionKey, inject, provide } from '@vue/composition-api'
import { createHttpLink } from 'apollo-link-http'
import { getIdToken } from '@/app/logic/api/base'
import { setContext } from 'apollo-link-context'
import { useConfig } from '@/app/config'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface GQLAPIClient {
  query<T = any, TVariables = OperationVariables>(options: QueryOptions<TVariables> & { isAuth?: boolean }): Promise<ApolloQueryResult<T>>
  mutate<T = any, TVariables = OperationVariables>(options: MutationOptions<T, TVariables> & { isAuth?: boolean }): Promise<FetchResult<T>>
}

//========================================================================
//
//  Implementation
//
//========================================================================

const GQLAPIClientKey: InjectionKey<GQLAPIClient> = Symbol('GQLAPIClient')

function createGQLAPIClient(): GQLAPIClient {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const config = useConfig()

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const query: GQLAPIClient['query'] = async options => {
    const client = await getClient(options.isAuth)
    return client.query(options)
  }

  const mutate: GQLAPIClient['mutate'] = async options => {
    const client = await getClient(options.isAuth)
    return client.mutate(options)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  async function getClient(isAuth = false): Promise<ApolloClient<NormalizedCacheObject>> {
    let link: ApolloLink = createHttpLink({
      uri: getRequestURL,
    })

    if (isAuth) {
      const idToken = await getIdToken()
      const authLink = setContext((_, { headers }) => {
        return {
          headers: {
            ...headers,
            authorization: `Bearer ${idToken}`,
          },
        }
      })

      link = authLink.concat(link)
    }

    return new ApolloClient({
      link,
      cache: new InMemoryCache(),
    })
  }

  function getRequestURL(): string {
    return `${config.api.baseURL}/gql`
  }

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    query,
    mutate,
  }
}

function provideGQLAPIClient(client?: GQLAPIClient | typeof createGQLAPIClient): void {
  let instance: GQLAPIClient
  if (!client) {
    instance = createGQLAPIClient()
  } else {
    instance = typeof client === 'function' ? client() : client
  }
  provide(GQLAPIClientKey, instance)
}

function injectGQLAPIClient(): GQLAPIClient {
  validateGQLAPIClientProvided()
  return inject(GQLAPIClientKey)!
}

function validateGQLAPIClientProvided(): void {
  if (!inject(GQLAPIClientKey)) {
    throw new Error(`${GQLAPIClientKey.description} is not provided`)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { GQLAPIClient, createGQLAPIClient, injectGQLAPIClient, provideGQLAPIClient, validateGQLAPIClientProvided }
