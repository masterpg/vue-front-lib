import 'unfetch/polyfill'
import { ApolloClient, ApolloQueryResult, MutationOptions, OperationVariables, QueryOptions } from 'apollo-client'
import { ApolloLink, FetchResult } from 'apollo-link'
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory'
import { createHttpLink } from 'apollo-link-http'
import { setContext } from 'apollo-link-context'
import { sgetIdToken } from '@/app/logic/base'
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

type GQLEndpoint = 'lv1' | 'lv2' | 'lv3' | 'lv4' | 'dev' | 'example'

//========================================================================
//
//  Implementation
//
//========================================================================

namespace GQLAPIClient {
  export function newInstance(endpoint: GQLEndpoint): GQLAPIClient {
    return newRawInstance(endpoint)
  }

  export function newRawInstance(endpoint: GQLEndpoint) {
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
        const idToken = await sgetIdToken()
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
      return `${config.api.baseURL}/gql_${endpoint}`
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
}

//========================================================================
//
//  Exports
//
//========================================================================

export { GQLAPIClient }
