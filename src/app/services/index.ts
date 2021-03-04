import { APIContainer, useAPI } from '@/app/services/apis'
import { AppStorageService, ArticleStorageService, StorageService, UserStorageService } from '@/app/services/modules/storage'
import { HelperContainer, useHelper } from '@/app/services/helpers'
import { StoreContainer, useStore } from '@/app/services/stores'
import { ArticleService } from '@/app/services/modules/article'
import { AuthService } from '@/app/services/modules/auth'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ServiceContainer {
  readonly auth: AuthService
  readonly appStorage: StorageService
  readonly userStorage: StorageService
  readonly articleStorage: ArticleStorageService
  readonly article: ArticleService
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace ServiceContainer {
  let instance: ServiceContainer

  export function useService(services?: ServiceContainer): ServiceContainer {
    instance = services ?? instance ?? newInstance()
    return instance
  }

  export function newInstance(): ServiceContainer {
    return newRawInstance()
  }

  export function newRawInstance(options?: { apis?: APIContainer; helpers?: HelperContainer; stores?: StoreContainer }) {
    useAPI(options?.apis)
    useHelper(options?.helpers)
    useStore(options?.stores)

    return {
      auth: AuthService.newRawInstance(),
      appStorage: AppStorageService.newRawInstance(),
      userStorage: UserStorageService.newRawInstance(),
      articleStorage: ArticleStorageService.newRawInstance(),
      article: ArticleService.newRawInstance(),
    }
  }
}

//========================================================================
//
//  Export
//
//========================================================================

const { useService } = ServiceContainer
export { ServiceContainer, useService }

export * from '@/app/services/base'
export { AuthProviderType } from '@/app/services/modules/auth'
export { StorageService } from '@/app/services/modules/storage'

export { StorageHelper } from '@/app/services/helpers'
