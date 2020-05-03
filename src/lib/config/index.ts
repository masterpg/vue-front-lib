import URI from 'urijs'

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
  usersDir: string
}

//========================================================================
//
//  Implementation
//
//========================================================================

abstract class BaseConfig {
  protected constructor(params: { firebase: FirebaseConfig; api: Omit<APIConfig, 'baseURL'>; storage: StorageConfig }) {
    this.m_firebase = params.firebase
    this.m_api = this.getAPIConfig(params.api)
    this.m_storage = params.storage
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
