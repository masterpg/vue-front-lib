import { AppStorageService, ArticleStorageService, UserStorageService } from '@/app/services/modules/storage'
import { AuthService } from '@/app/services/modules/auth'
import { Entity } from '@/firestore-ex'
import { InternalServiceContainer } from '@/app/services/modules/internal'
import { ServiceContainer } from '@/app/services'
import { TestAPIContainer } from './apis'
import { TestStoreContainer } from './stores'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TestServiceContainer extends ServiceContainer {
  readonly auth: TestAuthService
  readonly appStorage: TestAppStorageService
  readonly userStorage: TestUserStorageService
  readonly articleStorage: TestArticleStorageService
}

type TestAuthService = ReturnType<typeof AuthService.newRawInstance>
type TestAppStorageService = ReturnType<typeof AppStorageService.newRawInstance>
type TestUserStorageService = ReturnType<typeof UserStorageService.newRawInstance>
type TestArticleStorageService = ReturnType<typeof ArticleStorageService.newRawInstance>

interface TestServiceDependency {
  apis: TestAPIContainer
  stores: TestStoreContainer
  internal: InternalServiceContainer
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TestServiceContainer {
  export function newInstance(): TestServiceContainer & { readonly dependency: TestServiceDependency } {
    const apis = TestAPIContainer.newInstance()
    const stores = TestStoreContainer.newInstance()
    const internal = InternalServiceContainer.newRawInstance()
    const dependency = { apis, stores, internal }

    const base = ServiceContainer.newRawInstance(dependency)

    return {
      ...base,
      dependency,
    }
  }
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

export { TestServiceContainer, TestAppStorageService, TestUserStorageService, TestArticleStorageService, expectToBeCopyEntity }
export * from './apis'
export * from './stores'
export * from './modules/storage'
