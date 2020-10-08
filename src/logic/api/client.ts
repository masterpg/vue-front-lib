import { InjectionKey, inject, provide } from '@vue/composition-api'
import axios, { Method, ResponseType } from 'axios'
import { injectConfig } from '@/config'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface APIClient {
  request<T = any>(config: APIRequestInternalConfig): APIPromise<T>
  get<T = any>(path: string, config?: APIRequestConfig): APIPromise<T>
  post<T = any>(path: string, data?: any, config?: APIRequestConfig): APIPromise<T>
  put<T = any>(path: string, data?: any, config?: APIRequestConfig): APIPromise<T>
  delete<T = any>(path: string, config?: APIRequestConfig): APIPromise<T>
}

interface APIRequestConfig {
  headers?: any
  params?: any
  paramsSerializer?: (params: any) => string
  responseType?: ResponseType
  isAuth?: boolean
}

interface APIResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: any
  config: APIRequestConfig
  request?: any
}

interface APIError extends Error {
  config: APIRequestConfig
  code?: string
  request?: any
  response?: APIResponse
}

type APIPromise<T = any> = Promise<APIResponse<T>>

interface APIRequestInternalConfig extends APIRequestConfig {
  url: string
  method: Method
  data?: any
}

//========================================================================
//
//  Implementation
//
//========================================================================

const APIClientKey: InjectionKey<APIClient> = Symbol('APIClient')

function createAPIClient(): APIClient {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const config = injectConfig()

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const request: APIClient['request'] = async config => {
    const axiosConfig = {
      ...config,
      baseURL: getRequestURL(),
    }
    delete axiosConfig.isAuth

    if (config.isAuth) {
      const idToken = await getIdToken()
      axiosConfig.headers = {
        ...(axiosConfig.headers || {}),
        Authorization: `Bearer ${idToken}`,
      }
    }

    return axios.request(axiosConfig)
  }

  const get: APIClient['get'] = (path, config) => {
    return request({
      ...(config || {}),
      url: path,
      method: 'get',
    })
  }

  const post: APIClient['post'] = (path, data, config) => {
    return request({
      ...(config || {}),
      url: path,
      method: 'post',
      data,
    })
  }

  const put: APIClient['put'] = (path, data, config) => {
    return request({
      ...(config || {}),
      url: path,
      method: 'put',
      data,
    })
  }

  const del: APIClient['delete'] = (path, config) => {
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
    return `${config.api.baseURL}`
  }

  // TODO
  //  この関数の戻り値はHTTPヘッダーの"Authorization: Bearer …"の｢…｣で使用されます。
  //  ただし以下のコードで生成する値は非常に擬似的なもので、"Authorization"の仕様に適合
  //  するものではありません。実装のアプリケーションではこの関数が必要かどうかを含め
  //  認証ロジックを実装してください。
  async function getIdToken(): Promise<string> {
    const idToken = localStorage.getItem('idToken')
    if (!idToken) {
      throw new Error(`The 'idToken' could not be obtained. You may not have signed in.`)
    }
    return idToken
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

function provideAPIClient(client?: APIClient | typeof createAPIClient): void {
  let instance: APIClient
  if (!client) {
    instance = createAPIClient()
  } else {
    instance = typeof client === 'function' ? client() : client
  }
  provide(APIClientKey, instance)
}

function injectAPIClient(): APIClient {
  validateAPIClientProvided()
  return inject(APIClientKey)!
}

function validateAPIClientProvided(): void {
  if (!inject(APIClientKey)) {
    throw new Error(`${APIClientKey.description} is not provided`)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  APIClient,
  APIError,
  APIPromise,
  APIRequestConfig,
  APIResponse,
  createAPIClient,
  injectAPIClient,
  provideAPIClient,
  validateAPIClientProvided,
}
