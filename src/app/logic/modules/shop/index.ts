import { CartItem, Product } from '@/app/logic/types'
import { ComputedRef, watch } from '@vue/composition-api'
import { DeepReadonly } from 'web-base-lib'
import { injectAPI } from '@/app/logic/api'
import { injectInternalLogic } from '@/app/logic/modules/internal'
import { injectStore } from '@/app/logic/store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ShopLogic {
  readonly products: DeepReadonly<Product>[]

  readonly cartItems: DeepReadonly<CartItem>[]

  readonly cartTotalPrice: ComputedRef<number>

  fetchProducts(): Promise<DeepReadonly<Product>[]>

  fetchCartItems(): Promise<DeepReadonly<CartItem>[]>

  addItemToCart(productId: string): Promise<void>

  removeItemFromCart(productId: string): Promise<void>

  checkout(): Promise<void>
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createShopLogic(): ShopLogic {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const api = injectAPI()
  const internal = injectInternalLogic()
  const store = injectStore()

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const fetchProducts: ShopLogic['fetchProducts'] = async () => {
    const products = await api.getProducts()
    store.product.setAll(products)
    return store.product.all
  }

  const fetchCartItems: ShopLogic['fetchCartItems'] = async () => {
    internal.auth.validateSignedIn()

    const cartItems = await api.getCartItems()
    store.cart.setAll(cartItems)
    return store.cart.all
  }

  const addItemToCart: ShopLogic['addItemToCart'] = async productId => {
    internal.auth.validateSignedIn()

    const product = store.product.sgetById(productId)
    if (product.stock <= 0) {
      throw new Error(`Out of stock.`)
    }

    const cartItem = store.cart.getByProductId(productId)
    if (!cartItem) {
      await addCartItem(productId)
    } else {
      await updateCartItem(productId, 1)
    }
  }

  const removeItemFromCart: ShopLogic['removeItemFromCart'] = async productId => {
    internal.auth.validateSignedIn()

    const cartItem = store.cart.sgetByProductId(productId)
    if (cartItem.quantity > 1) {
      await updateCartItem(productId, -1)
    } else {
      await removeCartItem(productId)
    }
  }

  const checkout: ShopLogic['checkout'] = async () => {
    internal.auth.validateSignedIn()

    await api.checkoutCart()

    // カートを空にする
    store.cart.clear()
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  async function addCartItem(productId: string): Promise<void> {
    const product = store.product.sgetById(productId)!
    const newCartItem = {
      productId,
      title: product.title,
      price: product.price,
      quantity: 1,
    }
    const apiResponse = (await api.addCartItems([newCartItem]))[0]
    store.product.set(apiResponse.product)
    store.cart.add(apiResponse)
  }

  async function updateCartItem(productId: string, quantity: number): Promise<void> {
    const cartItem = store.cart.sgetByProductId(productId)
    const updateCartItem = {
      id: cartItem.id,
      quantity: cartItem.quantity + quantity,
    }
    const apiResponse = (await api.updateCartItems([updateCartItem]))[0]
    store.product.set(apiResponse.product)
    store.cart.set(apiResponse)
  }

  async function removeCartItem(productId: string): Promise<void> {
    const cartItem = store.cart.sgetByProductId(productId)
    const apiResponse = (await api.removeCartItems([cartItem.id]))[0]
    store.product.set(apiResponse.product)
    store.cart.remove(apiResponse.id)
  }

  function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max))
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  watch(
    () => internal.auth.isSignedIn.value,
    async (newValue, oldValue) => {
      // サインインした場合
      if (newValue) {
        await fetchProducts()
        await fetchCartItems()
      }
      // サインアウトした場合
      else {
        store.cart.setAll([])
      }
    }
  )

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    products: store.product.all,
    cartItems: store.cart.all,
    cartTotalPrice: store.cart.totalPrice,
    fetchProducts,
    fetchCartItems,
    addItemToCart,
    removeItemFromCart,
    checkout,
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { ShopLogic, createShopLogic }
