import { APIContainer, provideAPI } from '@/app/services/apis'
import { AppStorageService, ArticleStorageService, StorageService, UserStorageService } from '@/app/services/modules/storage'
import { InternalService, provideInternalService } from '@/app/services/modules/internal'
import { StoreContainer, provideStore } from '@/app/services/stores'
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
  export function newInstance(): ServiceContainer {
    return newRawInstance()
  }

  export function newRawInstance(options?: { apis?: APIContainer; stores?: StoreContainer; internal?: InternalService }) {
    const apis = options?.apis ?? APIContainer.newRawInstance()
    provideAPI(apis)

    const stores = options?.stores ?? StoreContainer.newRawInstance()
    provideStore(stores)

    const internal = options?.internal ?? InternalService.newRawInstance()
    provideInternalService(internal)

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
//  Dependency Injection
//
//========================================================================

let instance: ServiceContainer

function provideService(service?: ServiceContainer): void {
  instance = service ?? ServiceContainer.newInstance()
}

function injectService(): ServiceContainer {
  if (!instance) {
    throw new Error(`'ServiceContainer' is not provided`)
  }
  return instance
}

//========================================================================
//
//  Export
//
//========================================================================

export { ServiceContainer, injectService, provideService }
export * from '@/app/services/base'
export { AuthProviderType } from '@/app/services/modules/auth'
export { StorageService } from '@/app/services/modules/storage'
