import axios, { Method, ResponseType } from 'axios'
import { sgetIdToken } from '@/app/logic/base'
import { useConfig } from '@/app/config'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface RESTAPIClient {
  request<T = any>(config: RESTAPIRequestInternalConfig): RESTAPIPromise<T>
  get<T = any>(path: string, config?: RESTAPIRequestConfig): RESTAPIPromise<T>
  post<T = any>(path: string, data?: any, config?: RESTAPIRequestConfig): RESTAPIPromise<T>
  put<T = any>(path: string, data?: any, config?: RESTAPIRequestConfig): RESTAPIPromise<T>
  delete<T = any>(path: string, config?: RESTAPIRequestConfig): RESTAPIPromise<T>
}

interface RESTAPIRequestConfig {
  headers?: any
  params?: any
  paramsSerializer?: (params: any) => string
  responseType?: ResponseType
  isAuth?: boolean
}

interface RESTAPIResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: any
  config: RESTAPIRequestConfig
  request?: any
}

interface RESTAPIError extends Error {
  config: RESTAPIRequestConfig
  code?: string
  request?: any
  response?: RESTAPIResponse
}

type RESTAPIPromise<T = any> = Promise<RESTAPIResponse<T>>

interface RESTAPIRequestInternalConfig extends RESTAPIRequestConfig {
  url: string
  method: Method
  data?: any
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace RESTAPIClient {
  export function newInstance(): RESTAPIClient {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const config = useConfig()

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const request: RESTAPIClient['request'] = async config => {
      const axiosConfig = {
        ...config,
        baseURL: getRequestURL(),
      }
      delete axiosConfig.isAuth

      if (config.isAuth) {
        const idToken = await sgetIdToken()
        axiosConfig.headers = {
          ...(axiosConfig.headers || {}),
          Authorization: `Bearer ${idToken}`,
        }
      }

      return axios.request(axiosConfig)
    }

    const get: RESTAPIClient['get'] = (path, config) => {
      return request({
        ...(config || {}),
        url: path,
        method: 'get',
      })
    }

    const post: RESTAPIClient['post'] = (path, data, config) => {
      return request({
        ...(config || {}),
        url: path,
        method: 'post',
        data,
      })
    }

    const put: RESTAPIClient['put'] = (path, data, config) => {
      return request({
        ...(config || {}),
        url: path,
        method: 'put',
        data,
      })
    }

    const del: RESTAPIClient['delete'] = (path, config) => {
      return request({
        ...(config || {}),
        url: path,
        method: 'delete',
      })
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    function getRequestURL(): string {
      return `${config.api.baseURL}/rest`
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      request,
      get,
      post,
      put,
      delete: del,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { RESTAPIClient, RESTAPIError, RESTAPIPromise, RESTAPIRequestConfig, RESTAPIResponse }
