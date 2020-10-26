import { AppStorageLogic, ArticleStorageLogic, UserStorageLogic } from '@/app/logic/modules/storage'
import { LogicContainer, LogicDependency } from '@/app/logic'
import { Entity } from '@/firestore-ex'
import { InternalLogic } from '@/app/logic/modules/internal'
import { TestAPIContainer } from './api'
import { TestStoreContainer } from './store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TestLogicContainer extends LogicContainer {
  readonly appStorage: TestAppStorageLogic
  readonly userStorage: TestUserStorageLogic
  readonly articleStorage: TestArticleStorageLogic
}

type TestAppStorageLogic = ReturnType<typeof AppStorageLogic.newRawInstance>
type TestUserStorageLogic = ReturnType<typeof UserStorageLogic.newRawInstance>
type TestArticleStorageLogic = ReturnType<typeof ArticleStorageLogic.newRawInstance>

interface TestLogicDependency extends LogicDependency {
  api: TestAPIContainer
  store: TestStoreContainer
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TestLogicContainer {
  export function newInstance(): TestLogicContainer & { readonly dependency: TestLogicDependency } {
    const api = TestAPIContainer.newInstance()
    const store = TestStoreContainer.newInstance()
    const internal = InternalLogic.newInstance({ api, store })
    const dependency = { api, store, internal }

    const base = LogicContainer.newRawInstance(dependency)

    return {
      ...base,
      dependency,
    }
  }
}

function generateFirestoreId(): string {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let autoId = ''
  for (let i = 0; i < 20; i++) {
    autoId += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return autoId
}

/**
 * 指定されたアイテムがコピーであることを検証します。
 * @param actual
 * @param expected
 */
function expectToBeCopyEntity<T extends Entity>(actual: T | T[], expected: T | T[]): void {
  const actualItems = Array.isArray(actual) ? (actual as T[]) : [actual as T]
  const expectedItems = Array.isArray(expected) ? (expected as T[]) : [expected as T]

  for (let i = 0; i < actualItems.length; i++) {
    const actualItemItem = actualItems[i]
    const expectedItem = expectedItems[i]
    expect(actualItemItem.id).toBe(expectedItem.id)
    expect(actualItemItem).not.toBe(expectedItem)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestLogicContainer, TestAppStorageLogic, TestUserStorageLogic, TestArticleStorageLogic, generateFirestoreId, expectToBeCopyEntity }
export * from './api'
export * from './store'
export * from './modules/storage'
