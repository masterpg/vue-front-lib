import { ComputedRef, computed, reactive } from '@vue/composition-api'
import { CartItem } from '@/demo/services/base'
import { DeepReadonly } from 'web-base-lib'
import { StatePartial } from '@/app/services/stores/base'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface CartStore {
  readonly all: ComputedRef<DeepReadonly<CartItem>[]>

  readonly totalPrice: ComputedRef<number>

  getById(cartItemId: string): CartItem | undefined

  sgetById(cartItemId: string): CartItem

  getByProductId(productId: string): CartItem | undefined

  sgetByProductId(productId: string): CartItem

  exists(productId: string): boolean

  setAll(items: CartItem[]): void

  add(item: CartItem): CartItem

  set(item: StatePartial<Omit<CartItem, 'uid' | 'productId'>>): CartItem | undefined

  remove(cartItemId: string): CartItem | undefined

  clear(): void
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace CartStore {
  export function newInstance(): CartStore {
    return newRawInstance()
  }

  export function newRawInstance() {
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

    const all = computed(() => [...state.all])

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
      return CartItem.clone(getStateCartItemById(cartItemId))
    }

    const sgetById: CartStore['sgetById'] = cartItemId => {
      const result = getById(cartItemId)
      if (!result) {
        throw new Error(`The specified CartItem was not found: '${cartItemId}'`)
      }
      return result
    }

    const getByProductId: CartStore['getByProductId'] = productId => {
      const stateItem = state.all.find(item => item.productId === productId)
      return CartItem.clone(stateItem)
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
        state.all.push(CartItem.clone(item))
      }
    }

    const add: CartStore['add'] = item => {
      if (exists(item.id)) {
        throw new Error(`The specified CartItem already exists: '${item.id}'`)
      }

      const stateItem = CartItem.clone(item)
      state.all.push(stateItem)
      return CartItem.clone(stateItem)
    }

    const set: CartStore['set'] = item => {
      const stateItem = getStateCartItemById(item.id)
      if (!stateItem) {
        return
      }

      return CartItem.clone(CartItem.populate(item, stateItem))
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
        const stateItem = state.all[foundIndex]
        state.all.splice(foundIndex, 1)
        return CartItem.clone(stateItem)
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
      all,
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
      state,
    }
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { CartStore }
