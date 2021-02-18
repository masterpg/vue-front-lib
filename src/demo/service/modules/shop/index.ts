import { CartItem, Product } from '@/demo/service/base'
import { ComputedRef, watch } from '@vue/composition-api'
import { DeepReadonly } from 'web-base-lib'
import { injectAPI } from '@/demo/service/api'
import { injectInternalService } from '@/app/service/modules/internal'
import { injectStore } from '@/demo/service/store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ShopService {
  readonly products: ComputedRef<DeepReadonly<Product>[]>

  readonly cartItems: ComputedRef<DeepReadonly<CartItem>[]>

  readonly cartTotalPrice: ComputedRef<number>

  fetchProducts(): Promise<Product[]>

  fetchCartItems(): Promise<CartItem[]>

  addItemToCart(productId: string): Promise<void>

  removeItemFromCart(productId: string): Promise<void>

  checkout(): Promise<void>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace ShopService {
  export function newInstance(): ShopService {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const api = injectAPI()
    const store = injectStore()
    const internal = injectInternalService()

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const fetchProducts: ShopService['fetchProducts'] = async () => {
      const products = await api.getProducts()
      store.product.setAll(products)
      return Product.clone(store.product.all.value)
    }

    const fetchCartItems: ShopService['fetchCartItems'] = async () => {
      internal.auth.validateSignedIn()

      const cartItems = await api.getCartItems()
      store.cart.setAll(cartItems)
      return CartItem.clone(store.cart.all.value)
    }

    const addItemToCart: ShopService['addItemToCart'] = async productId => {
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

    const removeItemFromCart: ShopService['removeItemFromCart'] = async productId => {
      internal.auth.validateSignedIn()

      const cartItem = store.cart.sgetByProductId(productId)
      if (cartItem.quantity > 1) {
        await updateCartItem(productId, -1)
      } else {
        await removeCartItem(productId)
      }
    }

    const checkout: ShopService['checkout'] = async () => {
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
        // サインインが完了している場合
        if (newValue) {
          await fetchProducts()
          await fetchCartItems()
        }
        // サインインが完了していない場合
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
}

//========================================================================
//
//  Export
//
//========================================================================

export { ShopService }
