import URI from 'urijs'

//========================================================================
//
//  Exports
//
//========================================================================

export let config: BaseConfig

export function setConfig(value: BaseConfig): void {
  config = value
}

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  databaseURL?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
}

export interface APIConfig {
  protocol: string
  host: string
  port: number
  basePath: string
  baseURL: string
}

export abstract class BaseConfig {
  constructor(firebaseConfig: FirebaseConfig, apiConfig: Omit<APIConfig, 'baseURL'>) {
    this.firebase = firebaseConfig
    this.api = this.getAPIConfig(apiConfig)
    firebase.initializeApp(this.firebase!)
  }

  readonly firebase: FirebaseConfig

  readonly api: APIConfig

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
