import URI from 'urijs'
import Vue from 'vue'
import { config as appConfig } from '@/base/config'
import axios from 'axios'

export interface APIRequestConfig {
  headers?: any
  params?: any
  paramsSerializer?: (params: any) => string
  responseType?: string
}

export interface APIResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: any
  config: APIRequestConfig
  request?: any
}

export interface APIError extends Error {
  config: APIRequestConfig
  code?: string
  request?: any
  response?: APIResponse
}

export interface APIPromise<T = any> extends Promise<APIResponse<T>> {}

interface APIRequestInternalConfig extends APIRequestConfig {
  url: string
  method: string
  data?: any
}

export abstract class BaseAPI extends Vue {
  get<T = any>(path: string, config?: APIRequestConfig): APIPromise<T> {
    return this.request(
      Object.assign(config || {}, {
        url: path,
        method: 'get',
      })
    )
  }

  delete(path: string, config?: APIRequestConfig): APIPromise {
    return this.request(
      Object.assign(config || {}, {
        url: path,
        method: 'delete',
      })
    )
  }

  post<T = any>(path: string, data?: any, config?: APIRequestConfig): APIPromise<T> {
    return this.request(
      Object.assign(config || {}, {
        url: path,
        method: 'post',
        data,
      })
    )
  }

  put<T = any>(path: string, data?: any, config?: APIRequestConfig): APIPromise<T> {
    return this.request(
      Object.assign(config || {}, {
        url: path,
        method: 'put',
        data,
      })
    )
  }

  request<T = any>(config: APIRequestInternalConfig): APIPromise<T> {
    const axiosConfig = Object.assign(config || {}, {
      baseURL: this.getRequestURL(),
    })
    return axios.request(axiosConfig)
  }

  protected getRequestURL(): string {
    const baseURL = new URI()
    if (appConfig.api.protocol) baseURL.protocol(appConfig.api.protocol)
    if (appConfig.api.host) baseURL.hostname(appConfig.api.host)
    if (appConfig.api.baseURL) {
      baseURL.path(URI.joinPaths(appConfig.api.baseURL, 'rest').path())
    } else {
      baseURL.path('rest')
    }
    baseURL.query('')
    if (appConfig.api.port) baseURL.port(appConfig.api.port.toString(10))

    return baseURL.toString()
  }
}
