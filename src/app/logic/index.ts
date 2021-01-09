import { APIContainer, provideAPI } from '@/app/logic/api'
import { AppStorageLogic, ArticleStorageLogic, StorageLogic, UserStorageLogic } from '@/app/logic/modules/storage'
import { InternalLogic, provideInternalLogic } from '@/app/logic/modules/internal'
import { StoreContainer, provideStore } from '@/app/logic/store'
import { AuthLogic } from '@/app/logic/modules/auth'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface LogicContainer {
  readonly auth: AuthLogic
  readonly appStorage: StorageLogic
  readonly userStorage: StorageLogic
  readonly articleStorage: ArticleStorageLogic
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace LogicContainer {
  export function newInstance(): LogicContainer {
    return newRawInstance()
  }

  export function newRawInstance(options?: { api?: APIContainer; store?: StoreContainer; internal?: InternalLogic }) {
    const api = options?.api ?? APIContainer.newRawInstance()
    provideAPI(api)
    const store = options?.store ?? StoreContainer.newRawInstance()
    provideStore(store)
    const internal = options?.internal ?? InternalLogic.newRawInstance()
    provideInternalLogic(internal)

    return {
      auth: AuthLogic.newRawInstance(),
      appStorage: AppStorageLogic.newRawInstance(),
      userStorage: UserStorageLogic.newRawInstance(),
      articleStorage: ArticleStorageLogic.newRawInstance(),
    }
  }
}

//========================================================================
//
//  Dependency Injection
//
//========================================================================

let instance: LogicContainer

function provideLogic(logic?: LogicContainer): void {
  instance = logic ?? LogicContainer.newInstance()
}

function injectLogic(): LogicContainer {
  if (!instance) {
    throw new Error(`'LogicContainer' is not provided`)
  }
  return instance
}

//========================================================================
//
//  Export
//
//========================================================================

export { LogicContainer, injectLogic, provideLogic }
export * from '@/app/logic/base'
export { AuthProviderType } from '@/app/logic/modules/auth'
export { StorageLogic } from '@/app/logic/modules/storage'
