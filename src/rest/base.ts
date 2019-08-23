import * as firebase from 'firebase'
import axios, { Method, ResponseType } from 'axios'
import URI from 'urijs'
import Vue from 'vue'
import { config as appConfig } from '@/base/config'

export interface APIRequestConfig {
  headers?: any
  params?: any
  paramsSerializer?: (params: any) => string
  responseType?: ResponseType
  isAuth?: boolean
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

export type APIPromise<T = any> = Promise<APIResponse<T>>

interface APIRequestInternalConfig extends APIRequestConfig {
  url: string
  method: Method
  data?: any
}

export abstract class BaseAPI extends Vue {
  get<T = any>(path: string, config?: APIRequestConfig): APIPromise<T> {
    return this.request({
      ...(config || {}),
      url: path,
      method: 'get',
    })
  }

  delete(path: string, config?: APIRequestConfig): APIPromise {
    return this.request({
      ...(config || {}),
      url: path,
      method: 'delete',
    })
  }

  post<T = any>(path: string, data?: any, config?: APIRequestConfig): APIPromise<T> {
    return this.request({
      ...(config || {}),
      url: path,
      method: 'post',
      data,
    })
  }

  put<T = any>(path: string, data?: any, config?: APIRequestConfig): APIPromise<T> {
    return this.request({
      ...(config || {}),
      url: path,
      method: 'put',
      data,
    })
  }

  async request<T = any>(config: APIRequestInternalConfig): APIPromise<T> {
    const axiosConfig = {
      ...config,
      baseURL: this.getRequestURL(),
    }
    delete axiosConfig.isAuth

    if (config.isAuth) {
      const idToken = await this.getIdToken()
      axiosConfig.headers = {
        ...(axiosConfig.headers || {}),
        Authorization: `Bearer ${idToken}`,
      }
    }

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

  protected async getIdToken(): Promise<string> {
    const currentUser = firebase.auth().currentUser
    if (!currentUser) throw new Error('Not signed in.')
    return await currentUser.getIdToken()
  }
}
