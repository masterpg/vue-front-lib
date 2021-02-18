import { CartItem, Product } from '@/demo/services/base'
import { ComputedRef, watch } from '@vue/composition-api'
import { DeepReadonly } from 'web-base-lib'
import { injectAPI } from '@/demo/services/apis'
import { injectInternalService } from '@/app/services/modules/internal'
import { injectStore } from '@/demo/services/stores'

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

    const apis = injectAPI()
    const stores = injectStore()
    const internal = injectInternalService()

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const fetchProducts: ShopService['fetchProducts'] = async () => {
      const products = await apis.getProducts()
      stores.product.setAll(products)
      return Product.clone(stores.product.all.value)
    }

    const fetchCartItems: ShopService['fetchCartItems'] = async () => {
      internal.auth.validateSignedIn()

      const cartItems = await apis.getCartItems()
      stores.cart.setAll(cartItems)
      return CartItem.clone(stores.cart.all.value)
    }

    const addItemToCart: ShopService['addItemToCart'] = async productId => {
      internal.auth.validateSignedIn()

      const product = stores.product.sgetById(productId)
      if (product.stock <= 0) {
        throw new Error(`Out of stock.`)
      }

      const cartItem = stores.cart.getByProductId(productId)
      if (!cartItem) {
        await addCartItem(productId)
      } else {
        await updateCartItem(productId, 1)
      }
    }

    const removeItemFromCart: ShopService['removeItemFromCart'] = async productId => {
      internal.auth.validateSignedIn()

      const cartItem = stores.cart.sgetByProductId(productId)
      if (cartItem.quantity > 1) {
        await updateCartItem(productId, -1)
      } else {
        await removeCartItem(productId)
      }
    }

    const checkout: ShopService['checkout'] = async () => {
      internal.auth.validateSignedIn()

      await apis.checkoutCart()

      // カートを空にする
      stores.cart.clear()
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    async function addCartItem(productId: string): Promise<void> {
      const product = stores.product.sgetById(productId)!
      const newCartItem = {
        productId,
        title: product.title,
        price: product.price,
        quantity: 1,
      }
      const apiResponse = (await apis.addCartItems([newCartItem]))[0]
      stores.product.set(apiResponse.product)
      stores.cart.add(apiResponse)
    }

    async function updateCartItem(productId: string, quantity: number): Promise<void> {
      const cartItem = stores.cart.sgetByProductId(productId)
      const updateCartItem = {
        id: cartItem.id,
        quantity: cartItem.quantity + quantity,
      }
      const apiResponse = (await apis.updateCartItems([updateCartItem]))[0]
      stores.product.set(apiResponse.product)
      stores.cart.set(apiResponse)
    }

    async function removeCartItem(productId: string): Promise<void> {
      const cartItem = stores.cart.sgetByProductId(productId)
      const apiResponse = (await apis.removeCartItems([cartItem.id]))[0]
      stores.product.set(apiResponse.product)
      stores.cart.remove(apiResponse.id)
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
          stores.cart.setAll([])
        }
      }
    )

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      products: stores.product.all,
      cartItems: stores.cart.all,
      cartTotalPrice: stores.cart.totalPrice,
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
