import { CartItem, Product } from '@/demo/service'
import { CartStore } from '@/demo/service/store/cart'
import { DeepReadonly } from 'web-base-lib'
import { DemoStoreContainer } from '@/demo/service/store'
import { ProductStore } from '@/demo/service/store/product'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface TestDemoStoreContainer extends DemoStoreContainer {
  readonly product: ReturnType<typeof ProductStore['newRawInstance']>
  readonly cart: ReturnType<typeof CartStore['newRawInstance']>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace TestDemoStoreContainer {
  export function newInstance(): TestDemoStoreContainer {
    const base = DemoStoreContainer.newRawInstance()
    return {
      ...base,
    }
  }
}

//--------------------------------------------------
//  Product
//--------------------------------------------------

/**
 * 指定されたアイテムがストアのコピーであることを検証します。
 * @param store
 * @param actual
 */
function toBeCopyProduct<T extends DeepReadonly<Product>>(store: TestDemoStoreContainer, actual: T | T[]): void {
  const items = Array.isArray(actual) ? (actual as T[]) : [actual as T]
  for (const item of items) {
    const stateItem = store.cart.state.all.find(stateItem => stateItem.id === item.id)
    expect(item).not.toBe(stateItem)
  }
}

//--------------------------------------------------
//  CartItem
//--------------------------------------------------

/**
 * 指定されたアイテムがストアのコピーであることを検証します。
 * @param store
 * @param actual
 */
function toBeCopyCartItem<T extends DeepReadonly<CartItem>>(store: TestDemoStoreContainer, actual: T | T[]): void {
  const items = Array.isArray(actual) ? (actual as T[]) : [actual as T]
  for (const item of items) {
    const stateItem = store.cart.state.all.find(stateItem => stateItem.id === item.id)
    expect(item).not.toBe(stateItem)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestDemoStoreContainer, toBeCopyCartItem, toBeCopyProduct }
