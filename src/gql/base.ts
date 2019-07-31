import 'firebase/auth'
import * as firebase from 'firebase/app'
import { ApolloClient, ApolloQueryResult, MutationOptions, OperationVariables, QueryOptions } from 'apollo-client'
import { ApolloLink, FetchResult } from 'apollo-link'
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory'
import Component from 'vue-class-component'
import URI from 'urijs'
import Vue from 'vue'
import { config as appConfig } from '@/base/config'
import { createHttpLink } from 'apollo-link-http'
import { setContext } from 'apollo-link-context'

@Component
export class GQLClient extends Vue {
  async query<T = any, TVariables = OperationVariables>(options: QueryOptions<TVariables> & { auth?: boolean }): Promise<ApolloQueryResult<T>> {
    const client = await this.m_getClient(options.auth)
    return client.query(options)
  }

  async mutate<T = any, TVariables = OperationVariables>(options: MutationOptions<T, TVariables> & { auth?: boolean }): Promise<FetchResult<T>> {
    const client = await this.m_getClient(options.auth)
    return client.mutate(options)
  }

  private async m_getClient(auth: boolean = false): Promise<ApolloClient<NormalizedCacheObject>> {
    const baseURL = new URI()
    if (appConfig.gql.protocol) baseURL.protocol(appConfig.gql.protocol)
    if (appConfig.gql.host) baseURL.hostname(appConfig.gql.host)
    if (appConfig.gql.baseURL) {
      baseURL.pathname(appConfig.gql.baseURL)
    } else {
      baseURL.pathname('')
    }
    baseURL.query('')
    if (appConfig.gql.port) baseURL.port(appConfig.gql.port.toString(10))

    let link: ApolloLink = createHttpLink({
      uri: baseURL.toString(),
    })

    if (auth) {
      const currentUser = firebase.auth().currentUser
      if (!currentUser) throw new Error('Not signed in.')

      const idToken = await currentUser.getIdToken()

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
}

export const gqlClient = new GQLClient()
