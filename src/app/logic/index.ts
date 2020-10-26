import { AppStorageLogic, ArticleStorageLogic, StorageLogic, UserStorageLogic } from '@/app/logic/modules/storage'
import { InjectionKey, inject, provide } from '@vue/composition-api'
import { APIContainer } from '@/app/logic/api'
import { AuthLogic } from '@/app/logic/modules/auth'
import { InternalLogic } from '@/app/logic/modules/internal'
import { LogicDependency } from '@/app/logic/base'
import { StoreContainer } from '@/app/logic/store'

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

  export function newRawInstance(options?: Partial<LogicDependency>) {
    const api = options?.api ?? APIContainer.newRawInstance()
    const store = options?.store ?? StoreContainer.newRawInstance()
    const internal = options?.internal ?? InternalLogic.newRawInstance({ api, store })
    const dependency = { api, store, internal }

    return {
      auth: AuthLogic.newRawInstance(dependency),
      appStorage: AppStorageLogic.newRawInstance(dependency),
      userStorage: UserStorageLogic.newRawInstance(dependency),
      articleStorage: ArticleStorageLogic.newRawInstance(dependency),
    }
  }
}

//========================================================================
//
//  Dependency Injection
//
//========================================================================

const LogicKey: InjectionKey<LogicContainer> = Symbol('Logic')

function provideLogic(instance?: LogicContainer): void {
  instance = instance ?? LogicContainer.newInstance()
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

export { LogicContainer, LogicKey, injectLogic, provideLogic, validateLogicProvided }
export * from '@/app/logic/base'
export { AuthProviderType } from '@/app/logic/modules/auth'
export { StorageType } from '@/app/logic/modules/storage'
