import 'firebase/auth'
import 'unfetch/polyfill'
import * as firebase from 'firebase/app'
import { ApolloClient, ApolloQueryResult, MutationOptions, OperationVariables, QueryOptions } from 'apollo-client'
import { ApolloLink, FetchResult } from 'apollo-link'
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory'
import URI from 'urijs'
import { config as appConfig } from '@/base/config'
import { createHttpLink } from 'apollo-link-http'
import { setContext } from 'apollo-link-context'

export abstract class BaseGQLClient {
  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async query<T = any, TVariables = OperationVariables>(options: QueryOptions<TVariables> & { auth?: boolean }): Promise<ApolloQueryResult<T>> {
    const client = await this.m_getClient(options.auth)
    return client.query(options)
  }

  async mutate<T = any, TVariables = OperationVariables>(options: MutationOptions<T, TVariables> & { auth?: boolean }): Promise<FetchResult<T>> {
    const client = await this.m_getClient(options.auth)
    return client.mutate(options)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_getClient(auth: boolean = false): Promise<ApolloClient<NormalizedCacheObject>> {
    let link: ApolloLink = createHttpLink({
      uri: this.getRequestURL,
    })

    if (auth) {
      const idToken = await this.getIdToken()
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

  protected getRequestURL(): string {
    const baseURL = new URI()
    if (appConfig.api.protocol) baseURL.protocol(appConfig.api.protocol)
    if (appConfig.api.host) baseURL.hostname(appConfig.api.host)
    if (appConfig.api.baseURL) {
      baseURL.path(URI.joinPaths(appConfig.api.baseURL, 'gql').path())
    } else {
      baseURL.pathname('gql')
    }
    baseURL.query('')
    if (appConfig.api.port) baseURL.port(appConfig.api.port.toString(10))

    return baseURL.toString()
  }

  protected async getIdToken(): Promise<string> {
    const currentUser = firebase.auth().currentUser
    if (!currentUser) throw new Error('Not signed in.')
    return await currentUser.getIdToken()
  }
}
