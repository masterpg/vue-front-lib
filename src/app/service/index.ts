import { APIContainer, provideAPI } from '@/app/service/api'
import { AppStorageService, ArticleStorageService, StorageService, UserStorageService } from '@/app/service/modules/storage'
import { InternalService, provideInternalService } from '@/app/service/modules/internal'
import { StoreContainer, provideStore } from '@/app/service/store'
import { AuthService } from '@/app/service/modules/auth'

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

  export function newRawInstance(options?: { api?: APIContainer; store?: StoreContainer; internal?: InternalService }) {
    const api = options?.api ?? APIContainer.newRawInstance()
    provideAPI(api)
    const store = options?.store ?? StoreContainer.newRawInstance()
    provideStore(store)
    const internal = options?.internal ?? InternalService.newRawInstance()
    provideInternalService(internal)

    return {
      auth: AuthService.newRawInstance(),
      appStorage: AppStorageService.newRawInstance(),
      userStorage: UserStorageService.newRawInstance(),
      articleStorage: ArticleStorageService.newRawInstance(),
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
export * from '@/app/service/base'
export { AuthProviderType } from '@/app/service/modules/auth'
export { StorageService } from '@/app/service/modules/storage'
