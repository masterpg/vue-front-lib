import { DeepPartial } from 'web-base-lib'
import URI from 'urijs'
import firebaseConfig from '../../../firebase.config'
import merge from 'lodash/merge'

//========================================================================
//
//  Interfaces
//
//========================================================================

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
  user: StorageUsersConfig
  article: StorageArticlesConfig
}

interface StorageUsersConfig {
  rootName: string
}

interface StorageArticlesConfig {
  rootName: string
  fileName: string
  assetsName: string
}

//========================================================================
//
//  Implementation
//
//========================================================================

abstract class BaseConfig {
  protected constructor(
    params: {
      firebase?: DeepPartial<FirebaseConfig>
      api?: DeepPartial<Omit<APIConfig, 'baseURL'>>
      storage?: DeepPartial<StorageConfig>
    } = {}
  ) {
    this.m_firebase = merge(firebaseConfig, params.firebase)

    this.m_api = this.getAPIConfig(
      merge(
        {
          protocol: String(process.env.VUE_APP_API_PROTOCOL),
          host: String(process.env.VUE_APP_API_HOST),
          port: Number(process.env.VUE_APP_API_PORT),
          basePath: String(process.env.VUE_APP_API_BASE_PATH),
        },
        params.api
      )
    )

    this.m_storage = merge(
      {
        user: {
          rootName: 'users',
        },
        article: {
          rootName: 'articles',
          fileName: '__index__.md',
          assetsName: 'assets',
        },
      },
      params.storage
    )

    firebase.initializeApp(this.firebase!)
  }

  private m_firebase: FirebaseConfig

  get firebase(): FirebaseConfig {
    return this.m_firebase
  }

  protected setFirebase(value: FirebaseConfig): void {
    this.m_firebase = value
  }

  private m_api: APIConfig

  get api(): APIConfig {
    return this.m_api
  }

  protected setAPI(value: Omit<APIConfig, 'baseURL'>): void {
    this.m_api = this.getAPIConfig(value)
  }

  private m_storage: StorageConfig

  get storage(): StorageConfig {
    return this.m_storage
  }

  protected setStorage(value: StorageConfig): void {
    this.m_storage = value
  }

  protected getAPIConfig(apiConfig: Omit<APIConfig, 'baseURL'>): APIConfig {
    const baseURL = new URI()
    if (apiConfig.protocol) baseURL.protocol(apiConfig.protocol)
    if (apiConfig.host) baseURL.hostname(apiConfig.host)
    if (apiConfig.port) baseURL.port(apiConfig.port.toString(10))
    if (apiConfig.basePath) baseURL.path(apiConfig.basePath)
    baseURL.query('')

    return {
      ...apiConfig,
      baseURL: baseURL.toString().replace(/\/$/, ''),
    }
  }
}

let config: BaseConfig

function setConfig(value: BaseConfig): void {
  config = value
}

//========================================================================
//
//  Exports
//
//========================================================================

export { FirebaseConfig, APIConfig, StorageConfig, BaseConfig, config, setConfig }
