import Vue from 'vue';
import axios from 'axios';

export interface ApiRequestConfig {
  headers?: any;
  params?: any;
  paramsSerializer?: (params: any) => string;
  responseType?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: ApiRequestConfig;
  request?: any;
}

export interface ApiError extends Error {
  config: ApiRequestConfig;
  code?: string;
  request?: any;
  response?: ApiResponse;
}

export interface ApiPromise<T = any> extends Promise<ApiResponse<T>> {
}

interface ApiRequestInternalConfig extends ApiRequestConfig {
  url: string;
  method: string;
  data?: any;
}

export abstract class BaseApi extends Vue {
  get<T = any>(path: string, config?: ApiRequestConfig): ApiPromise<T> {
    return this.request(Object.assign(config || {}, {
      url: path, method: 'get',
    }));
  }

  delete(path: string, config?: ApiRequestConfig): ApiPromise {
    return this.request(Object.assign(config || {}, {
      url: path, method: 'delete',
    }));
  }

  post<T = any>(path: string, data?: any, config?: ApiRequestConfig): ApiPromise<T> {
    return this.request(Object.assign(config || {}, {
      url: path, method: 'post', data,
    }));
  }

  put<T = any>(path: string, data?: any, config?: ApiRequestConfig): ApiPromise<T> {
    return this.request(Object.assign(config || {}, {
      url: path, method: 'put', data,
    }));
  }

  request<T = any>(config: ApiRequestInternalConfig): ApiPromise<T> {
    const apiInfo = this.$config.apiInfo;
    const axiosConfig = Object.assign(config || {}, {
      baseURL: `${apiInfo.protocol}://${apiInfo.host}:${apiInfo.port}/api/`,
    });
    return axios.request(axiosConfig);
  }
}
