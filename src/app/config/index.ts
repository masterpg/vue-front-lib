import { DeepPartial, removeEndSlash } from 'web-base-lib'
import { InjectionKey, inject, provide, reactive } from '@vue/composition-api'
import URI from 'urijs'
import merge from 'lodash/merge'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface Config {
  api: APIConfig
}

interface APIConfig {
  protocol: string
  host: string
  port: number
  basePath: string
  baseURL: string
}

interface CreateConfigParam {
  api?: DeepPartial<Omit<APIConfig, 'baseURL'>>
}

//========================================================================
//
//  Implementation
//
//========================================================================

const ConfigKey: InjectionKey<Config> = Symbol('Config')

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

function createConfig(param: CreateConfigParam = {}): Config {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const state = reactive({
    api: getAPIConfig(
      merge(
        {
          protocol: String(process.env.VUE_APP_API_PROTOCOL),
          host: String(process.env.VUE_APP_API_HOST),
          port: Number(process.env.VUE_APP_API_PORT),
          basePath: String(process.env.VUE_APP_API_BASE_PATH),
        },
        param.api
      )
    ),
  })

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    api: state.api,
  }
}

function provideConfig(param: CreateConfigParam = {}): void {
  provide(ConfigKey, createConfig(param))
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

export { Config, ConfigKey, APIConfig, provideConfig, injectConfig, validateConfigProvided }
