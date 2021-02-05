import { DeepPartial, removeEndSlash } from 'web-base-lib'
import { StorageArticleConfig, StorageUserConfig } from 'web-base-lib'
import URI from 'urijs'
import firebase from 'firebase/app'
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

let config: Config

let initializedFirebase = false

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

function createConfig(params: CreateConfigParams = {}): Config {
  //----------------------------------------------------------------------
  //
  //  Variables
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

    firebase: merge(firebaseConfig, params.firebase),

    api: getAPIConfig(
      merge(
        {
          protocol: String(process.env.VUE_APP_API_PROTOCOL),
          host: String(process.env.VUE_APP_API_HOST),
          port: Number(process.env.VUE_APP_API_PORT),
          basePath: String(process.env.VUE_APP_API_BASE_PATH),
        },
        params.api
      )
    ),

    storage: merge(
      {
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
      params.storage
    ),
  })

  if (!initializedFirebase) {
    firebase.initializeApp(state.firebase)
    initializedFirebase = true
  }

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

function setupConfig(): Config {
  config = createConfig()
  return config
}

function useConfig(): Config {
  if (!config) {
    throw new Error('Config is not set up.')
  }
  return config
}

//========================================================================
//
//  Exports
//
//========================================================================

export { APIConfig, Config, FirebaseConfig, StorageConfig, setupConfig, useConfig }
