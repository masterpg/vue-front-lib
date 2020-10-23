import { APIContainer, createAPI, provideAPI } from '@/app/logic/api'
import { AppStorageLogic, ArticleStorageLogic, StorageLogic, UserStorageLogic } from '@/app/logic/modules/storage'
import { AuthLogic, createAuthLogic } from '@/app/logic/modules/auth'
import { InjectionKey, inject, provide } from '@vue/composition-api'
import { InternalLogic, createInternalLogic, provideInternalLogic } from '@/app/logic/modules/internal'
import { StoreContainer, createStore, provideStore } from '@/app/logic/store'

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

const LogicKey: InjectionKey<LogicContainer> = Symbol('Logic')

function createLogic(): LogicContainer {
  return {
    auth: createAuthLogic(),
    appStorage: AppStorageLogic.newInstance(),
    userStorage: UserStorageLogic.newInstance(),
    articleStorage: ArticleStorageLogic.newInstance(),
  }
}

function provideLogic(options?: {
  api?: APIContainer | typeof createAPI
  store?: StoreContainer | typeof createStore
  internal?: InternalLogic | typeof createInternalLogic
  logic?: LogicContainer | typeof createLogic
}): void {
  provideAPI(options?.api)
  provideStore(options?.store)
  provideInternalLogic(options?.internal)

  let instance: LogicContainer
  if (!options?.logic) {
    instance = createLogic()
  } else {
    instance = typeof options.logic === 'function' ? options.logic() : options.logic
  }
  provide(LogicKey, instance)
}

function injectLogic(): LogicContainer {
  validateLogicProvided()
  return inject(LogicKey)!
}

function validateLogicProvided(): void {
  if (!inject(LogicKey)) {
    throw new Error(`${LogicKey.description} is not provided`)
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { LogicContainer, LogicKey, createLogic, injectLogic, provideLogic, validateLogicProvided }
export * from '@/app/logic/base'
export { AuthProviderType } from '@/app/logic/modules/auth'
export { StorageType } from '@/app/logic/modules/storage'
