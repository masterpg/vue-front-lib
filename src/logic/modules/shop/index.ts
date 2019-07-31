import { CartItem, CheckoutStatus, Product, ShopLogic } from '@/logic/types'
import { BaseLogic } from '@/logic/base'
import { Component } from 'vue-property-decorator'
import { gql } from '@/gql'
import { store } from '@/store'
const assign = require('lodash/assign')
const cloneDeep = require('lodash/cloneDeep')

@Component
export class ShopLogicImpl extends BaseLogic implements ShopLogic {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  async created() {
    // // `products`の変更をリッスン
    // this.db.collection('products').onSnapshot(snapshot => {
    //   snapshot.forEach(doc => {
    //     // ローカルデータ(バックエンドにまだ書き込みされていないデータ)は無視する
    //     if (doc.metadata.hasPendingWrites) return
    //     // 取得した商品をStateへ書き込み
    //     let product = cloneDeep(store.product.getById(doc.id))
    //     if (product) {
    //       assign(product, doc.data())
    //       store.product.set(product)
    //     } else {
    //       product = assign({ id: doc.id }, doc.data()) as Product
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
    const products = await gql.query.products()
    store.product.setAll(products)
  }

  async pullCartItems(): Promise<void> {
    this.m_checkSignedIn()

    const items = await gql.query.cartItems(store.user.value.id)
    store.cart.setAll(items)
  }

  async addItemToCart(productId: string): Promise<void> {
    this.m_checkSignedIn()

    const cartItem = store.cart.getByProductId(productId)

    try {
      if (!cartItem) {
        await this.m_addCartItem(productId)
      } else {
        await this.m_updateCartItem(productId, 1)
      }
    } catch (err) {
      console.error(err)
      return
    }

    store.product.decrementStock(productId)
    store.cart.setCheckoutStatus(CheckoutStatus.None)
  }

  async removeItemFromCart(productId: string): Promise<void> {
    this.m_checkSignedIn()

    const cartItem = this.m_getCartItemByProductId(productId)

    try {
      if (cartItem.quantity > 1) {
        await this.m_updateCartItem(productId, -1)
      } else {
        await this.m_removeCartItem(productId)
      }
    } catch (err) {
      console.error(err)
      return
    }

    store.product.incrementStock(productId)
    store.cart.setCheckoutStatus(CheckoutStatus.None)
  }

  async checkout(): Promise<void> {
    this.m_checkSignedIn()

    try {
      await gql.mutation.checkoutCart(store.user.value.id)
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

  private async m_addCartItem(productId: string): Promise<void> {
    const product = store.product.getById(productId)!
    const newCartItem = {
      userId: store.user.value.id,
      productId,
      title: product.title,
      price: product.price,
      quantity: 1,
    }
    const responseCartItem = (await gql.mutation.addCartItems([newCartItem]))[0]
    store.cart.add(responseCartItem)
  }

  private async m_updateCartItem(productId: string, quantity: number): Promise<void> {
    const cartItem = this.m_getCartItemByProductId(productId)
    const newCartItem = {
      id: cartItem.id,
      quantity: cartItem.quantity + quantity,
    }
    const responseCartItem = (await gql.mutation.updateCartItems([newCartItem]))[0]
    store.cart.set(responseCartItem)
  }

  private async m_removeCartItem(productId: string): Promise<void> {
    const cartItem = this.m_getCartItemByProductId(productId)
    await gql.mutation.removeCartItems([cartItem.id])
    store.cart.remove(cartItem.id)
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
    if (!store.user.value.isSignedIn) {
      throw new Error('Not signed in.')
    }
  }
}
