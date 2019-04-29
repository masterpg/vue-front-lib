import Vue from 'vue'
import {Component} from 'vue-property-decorator'
import {CartItem, CheckoutStatus, Product, ShopLogic} from '@/logic/types'
import {api} from '@/api'
import {store} from '@/store'
import {NoCache} from '@/base/component'
import {utils} from '@/base/utils'

@Component
export class ShopLogicImpl extends Vue implements ShopLogic {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @NoCache
  get products(): Product[] {
    return utils.cloneDeep(store.products.all)
  }

  @NoCache
  get cartItems(): CartItem[] {
    return utils.cloneDeep(store.cart.all)
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
    const products = await api.shop.getProducts()
    store.products.setAll(products)
  }

  addProductToCart(productId: string): void {
    store.cart.setCheckoutStatus(CheckoutStatus.None)
    const product = this.m_getProductById(productId)
    if (product.inventory > 0) {
      store.cart.addProductToCart(product)
      store.products.decrementInventory(productId)
    }
  }

  async checkout(): Promise<void> {
    store.cart.setCheckoutStatus(CheckoutStatus.None)
    try {
      await api.shop.buyProducts(this.cartItems)
      store.cart.setAll([]) // カートを空にする
      store.cart.setCheckoutStatus(CheckoutStatus.Successful)
    } catch (err) {
      store.cart.setCheckoutStatus(CheckoutStatus.Failed)
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_getProductById(productId: string): Product {
    const result = store.products.getById(productId)
    if (!result) {
      throw new Error(`A Product that matches the specified productId "${productId}" was not found.`)
    }
    return result
  }
}
