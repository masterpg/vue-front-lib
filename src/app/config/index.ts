import { DeepPartial, removeEndSlash } from 'web-base-lib'
import { InjectionKey, inject, provide, reactive } from '@vue/composition-api'
import URI from 'urijs'
import merge from 'lodash/merge'
const firebaseConfig = require('../../../firebase.config')

//========================================================================
//
//  Interfaces
//
//========================================================================

interface Config {
  firebase: FirebaseConfig
  api: APIConfig
  storage: StorageConfig
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
    fileName: string
    assetsName: string
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
          rootName: 'users',
        },
        article: {
          rootName: 'articles',
          fileName: 'index.md',
          assetsName: 'assets',
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
    firebase: state.firebase,
    api: state.api,
    storage: state.storage,
  }
}

const ConfigKey: InjectionKey<Config> = Symbol('Config')

function provideConfig(params: CreateConfigParams = {}): void {
  provide(ConfigKey, createConfig(params))
}

function injectConfig(): Config {
  validateConfigProvided()
  return inject(ConfigKey)!
}

function validateConfigProvided(): void {
  const value = inject(ConfigKey)
  if (!value) {
    throw new Error(`${ConfigKey.description} is not provided`)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { APIConfig, Config, ConfigKey, FirebaseConfig, StorageConfig, injectConfig, provideConfig, validateConfigProvided }
