import { ComputedRef, computed, reactive } from '@vue/composition-api'
import { StatePartial, StoreUtil } from '@/app/logic/store/base'
import { CartItem } from '@/app/logic/types'
import { DeepReadonly } from 'web-base-lib'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface CartStore {
  readonly all: DeepReadonly<CartItem>[]

  readonly totalPrice: ComputedRef<number>

  getById(cartItemId: string): DeepReadonly<CartItem> | undefined

  sgetById(cartItemId: string): DeepReadonly<CartItem>

  getByProductId(productId: string): DeepReadonly<CartItem> | undefined

  sgetByProductId(productId: string): DeepReadonly<CartItem>

  exists(productId: string): boolean

  setAll(items: CartItem[]): void

  add(item: CartItem): DeepReadonly<CartItem>

  set(item: StatePartial<Omit<CartItem, 'uid' | 'productId'>>): DeepReadonly<CartItem> | undefined

  remove(cartItemId: string): DeepReadonly<CartItem> | undefined

  clear(): void
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createCartStore(): CartStore {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const state = reactive({
    all: [] as CartItem[],
  })

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  const totalPrice = computed(() => {
    const result = state.all.reduce((result, item) => {
      return result + item.price * item.quantity
    }, 0)
    return result
  })

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const exists: CartStore['exists'] = cartItemId => {
    return Boolean(getStateCartItemById(cartItemId))
  }

  const getById: CartStore['getById'] = cartItemId => {
    return getStateCartItemById(cartItemId)
  }

  const sgetById: CartStore['sgetById'] = cartItemId => {
    const result = getById(cartItemId)
    if (!result) {
      throw new Error(`The specified CartItem was not found: '${cartItemId}'`)
    }
    return result
  }

  const getByProductId: CartStore['getByProductId'] = productId => {
    return state.all.find(item => item.productId === productId)
  }

  const sgetByProductId: CartStore['sgetByProductId'] = productId => {
    const result = getByProductId(productId)
    if (!result) {
      throw new Error(`The specified CartItem was not found: ${JSON.stringify({ productId })}`)
    }
    return result
  }

  const setAll: CartStore['setAll'] = items => {
    state.all.splice(0)
    for (const item of items) {
      state.all.push(StoreUtil.cloneCartItem(item))
    }
  }

  const add: CartStore['add'] = item => {
    if (exists(item.id)) {
      throw new Error(`The specified CartItem already exists: '${item.id}'`)
    }

    const stateItem = StoreUtil.cloneCartItem(item)
    state.all.push(stateItem)
    return stateItem
  }

  const set: CartStore['set'] = item => {
    const stateItem = getStateCartItemById(item.id)
    if (!stateItem) {
      return
    }

    return StoreUtil.populateCartItem(item, stateItem)
  }

  const remove: CartStore['remove'] = cartItemId => {
    let foundIndex = -1
    state.all.some((cartItem, index) => {
      if (cartItem.id === cartItemId) {
        foundIndex = index
        return true
      }
      return false
    })
    if (foundIndex >= 0) {
      const result = state.all[foundIndex]
      state.all.splice(foundIndex, 1)
      return result
    }
    return undefined
  }

  const clear: CartStore['clear'] = () => {
    state.all.splice(0, state.all.length)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  function getStateCartItemById(cartItemId: string): CartItem | undefined {
    return state.all.find(item => item.id === cartItemId)
  }

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    all: state.all,
    totalPrice,
    exists,
    getById,
    sgetById,
    getByProductId,
    sgetByProductId,
    setAll,
    set,
    add,
    remove,
    clear,
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { CartStore, createCartStore }
