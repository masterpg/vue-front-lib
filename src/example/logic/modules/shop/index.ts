import { APICartItem, APICartItemEditResponse, APIProduct, api } from '../../api'
import { BaseLogic, User } from '@/lib'
import { CartItem, CheckoutStatus, Product, store } from '../../store'
import { Component } from 'vue-property-decorator'
import cloneDeep from 'lodash/cloneDeep'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ShopLogic {
  products: Product[]

  pullProducts(): Promise<void>

  cartItems: CartItem[]

  pullCartItems(): Promise<void>

  cartTotalPrice: number

  checkoutStatus: CheckoutStatus

  addItemToCart(productId: string): Promise<void>

  removeItemFromCart(productId: string): Promise<void>

  checkout(): Promise<void>
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class ShopLogicImpl extends BaseLogic implements ShopLogic {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  async created() {
    this.addSignedOutListener(this.m_userOnSignedOut)

    // // `products`の変更をリッスン
    // this.db.collection('products').onSnapshot(snapshot => {
    //   snapshot.forEach(doc => {
    //     // ローカルデータ(バックエンドにまだ書き込みされていないデータ)は無視する
    //     if (doc.metadata.hasPendingWrites) return
    //     // 取得した商品をStateへ書き込み
    //     let product = cloneDeep(store.product.getById(doc.id))
    //     if (product) {
    //       Object.assign(product, doc.data())
    //       store.product.set(product)
    //     } else {
    //       product = Object.assign({ id: doc.id }, doc.data()) as Product
    //       store.product.add(product)
    //     }
    //   })
    // })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get products(): Product[] {
    return store.product.all
  }

  get cartItems(): CartItem[] {
    return store.cart.all
  }

  get cartTotalPrice(): number {
    return store.cart.totalPrice
  }

  get checkoutStatus(): CheckoutStatus {
    return store.cart.checkoutStatus
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async pullProducts(): Promise<void> {
    let products: APIProduct[]
    try {
      products = await api.getProducts()
    } catch (err) {
      console.error(err)
      return
    }
    store.product.setAll(products)
  }

  async pullCartItems(): Promise<void> {
    this.m_checkSignedIn()

    let items: APICartItem[]
    try {
      items = await api.getCartItems()
    } catch (err) {
      console.error(err)
      return
    }
    store.cart.setAll(items)
  }

  async addItemToCart(productId: string): Promise<void> {
    this.m_checkSignedIn()

    const cartItem = store.cart.getByProductId(productId)

    let response: APICartItemEditResponse
    try {
      if (!cartItem) {
        response = await this.m_addCartItem(productId)
      } else {
        response = await this.m_updateCartItem(productId, 1)
      }
    } catch (err) {
      console.error(err)
      return
    }

    store.product.set(response.product)
    store.cart.setCheckoutStatus(CheckoutStatus.None)
  }

  async removeItemFromCart(productId: string): Promise<void> {
    this.m_checkSignedIn()

    const cartItem = this.m_getCartItemByProductId(productId)

    let response: APICartItemEditResponse
    try {
      if (cartItem.quantity > 1) {
        response = await this.m_updateCartItem(productId, -1)
      } else {
        response = await this.m_removeCartItem(productId)
      }
    } catch (err) {
      console.error(err)
      return
    }

    store.product.set(response.product)
    store.cart.setCheckoutStatus(CheckoutStatus.None)
  }

  async checkout(): Promise<void> {
    this.m_checkSignedIn()

    try {
      await api.checkoutCart()
    } catch (err) {
      console.log(err)
      store.cart.setCheckoutStatus(CheckoutStatus.Failed)
      return
    }

    store.cart.setAll([]) // カートを空にする
    store.cart.setCheckoutStatus(CheckoutStatus.Successful)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_addCartItem(productId: string): Promise<APICartItemEditResponse> {
    const product = store.product.getById(productId)!
    const newCartItem = {
      productId,
      title: product.title,
      price: product.price,
      quantity: 1,
    }
    const response = (await api.addCartItems([newCartItem]))[0]
    store.cart.add(response)
    return response
  }

  private async m_updateCartItem(productId: string, quantity: number): Promise<APICartItemEditResponse> {
    const cartItem = this.m_getCartItemByProductId(productId)
    const newCartItem = {
      id: cartItem.id,
      quantity: cartItem.quantity + quantity,
    }
    const response = (await api.updateCartItems([newCartItem]))[0]
    store.cart.set(response)
    return response
  }

  private async m_removeCartItem(productId: string): Promise<APICartItemEditResponse> {
    const cartItem = this.m_getCartItemByProductId(productId)
    const response = (await api.removeCartItems([cartItem.id]))[0]
    store.cart.remove(response.id)
    return response
  }

  private m_getProductById(productId: string): Product {
    const result = store.product.getById(productId)
    if (!result) {
      throw new Error(`A Product that matches the specified productId "${productId}" was not found.`)
    }
    return result
  }

  private m_getCartItemByProductId(productId: string): CartItem {
    const cartItem = store.cart.getByProductId(productId)
    if (!cartItem) {
      throw new Error(`The cart item was not found in the search by productId "${productId}".`)
    }
    return cartItem
  }

  private m_checkSignedIn(): void {
    if (!store.user.isSignedIn) {
      throw new Error('Not signed in.')
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_userOnSignedOut(user: User) {
    store.cart.clear()
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { ShopLogic, ShopLogicImpl }
