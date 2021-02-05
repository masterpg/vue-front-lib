import { DeepPartial, removeEndSlash } from 'web-base-lib'
import { StorageArticleConfig, StorageUserConfig } from 'web-base-lib'
import URI from 'urijs'
import merge from 'lodash/merge'
import { reactive } from '@vue/composition-api'
const firebaseConfig = require('../../../firebase.config')

//========================================================================
//
//  Interfaces
//
//========================================================================

interface Config {
  readonly env: EnvConfig
  readonly firebase: FirebaseConfig
  readonly api: APIConfig
  readonly storage: StorageConfig
}

interface EnvConfig {
  mode: 'prod' | 'dev' | 'test'
}

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  databaseURL?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
}

interface APIConfig {
  protocol: string
  host: string
  port: number
  basePath: string
  baseURL: string
}

interface StorageConfig {
  user: {
    rootName: string
  }
  article: {
    rootName: string
    assetsName: string
    srcMasterFileName: string
    srcDraftFileName: string
  }
}

interface CreateConfigParams {
  firebase?: DeepPartial<FirebaseConfig>
  api?: DeepPartial<Omit<APIConfig, 'baseURL'>>
  storage?: DeepPartial<StorageConfig>
}

//========================================================================
//
//  Implementation
//
//========================================================================

function getAPIConfig(apiConfig: Omit<APIConfig, 'baseURL'>): APIConfig {
  const baseURL = new URI()
  if (apiConfig.protocol) baseURL.protocol(apiConfig.protocol)
  if (apiConfig.host) baseURL.hostname(apiConfig.host)
  if (apiConfig.port) baseURL.port(apiConfig.port.toString(10))
  if (apiConfig.basePath) baseURL.path(apiConfig.basePath)
  baseURL.query('')

  return {
    protocol: baseURL.protocol(),
    host: baseURL.hostname(),
    port: parseInt(baseURL.port()),
    basePath: baseURL.path(),
    baseURL: removeEndSlash(baseURL.toString()),
  }
}

namespace Config {
  let instance: Config

  export function getInstance(params: CreateConfigParams = {}): Config {
    instance = instance ?? newInstance()

    merge(instance.firebase, params.firebase)
    merge(instance.api, params.api)
    merge(instance.storage, params.storage)

    return instance
  }

  function newInstance(): Config {
    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const state = reactive({
      env: {
        mode:
          process.env.NODE_ENV === 'production'
            ? 'prod'
            : process.env.NODE_ENV === 'development'
            ? 'dev'
            : process.env.NODE_ENV === 'test'
            ? 'test'
            : 'dev',
      } as EnvConfig,

      firebase: firebaseConfig,

      api: getAPIConfig({
        protocol: String(process.env.VUE_APP_API_PROTOCOL),
        host: String(process.env.VUE_APP_API_HOST),
        port: Number(process.env.VUE_APP_API_PORT),
        basePath: String(process.env.VUE_APP_API_BASE_PATH),
      }),

      storage: {
        user: {
          rootName: StorageUserConfig.RootName,
        },
        article: {
          rootName: StorageArticleConfig.RootName,
          assetsName: StorageArticleConfig.AssetsName,
          srcMasterFileName: StorageArticleConfig.SrcMasterFileName,
          srcDraftFileName: StorageArticleConfig.SrcDraftFileName,
        },
      },
    })

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      env: state.env,
      firebase: state.firebase,
      api: state.api,
      storage: state.storage,
    }
  }
}

function useConfig(): Config {
  return Config.getInstance()
}

//========================================================================
//
//  Exports
//
//========================================================================

export { APIConfig, Config, FirebaseConfig, StorageConfig, useConfig }
