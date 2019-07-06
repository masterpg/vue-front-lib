import { CartItem, CheckoutStatus, Product, ShopLogic } from '@/logic/types'
import { BaseLogic } from '@/logic/base'
import { Component } from 'vue-property-decorator'
import { NoCache } from '@/base/decorators'
import { store } from '@/store'
const assign = require('lodash/assign')
const cloneDeep = require('lodash/cloneDeep')
type Transaction = firebase.firestore.Transaction

@Component
export class ShopLogicImpl extends BaseLogic implements ShopLogic {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  async created() {
    // `products`の変更をリッスン
    this.db.collection('products').onSnapshot(snapshot => {
      snapshot.forEach(doc => {
        // ローカルデータ(バックエンドにまだ書き込みされていないデータ)は無視する
        if (doc.metadata.hasPendingWrites) return
        // 取得した商品をStateへ書き込み
        let product = cloneDeep(store.products.getById(doc.id))
        if (product) {
          assign(product, doc.data())
          store.products.set(product)
        } else {
          product = assign({ id: doc.id }, doc.data()) as Product
          store.products.add(product)
        }
      })
    })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @NoCache
  get products(): Product[] {
    return cloneDeep(store.products.all)
  }

  @NoCache
  get cartItems(): CartItem[] {
    return cloneDeep(store.cart.all)
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
    const products: Product[] = []
    const snapshot = await this.db.collection('products').get()
    snapshot.forEach(doc => {
      const product = assign({ id: doc.id }, doc.data()) as Product
      products.push(product)
    })
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

  checkout(): Promise<void> {
    store.cart.setCheckoutStatus(CheckoutStatus.None)
    // トランザクション開始
    return this.db
      .runTransaction(transaction => {
        // 配列に商品チェックアウト処理を格納する
        const promises: Promise<any>[] = []
        for (const cartItem of store.cart.all) {
          const promise = this.m_createCheckoutProcess(transaction, cartItem)
          promises.push(promise)
        }
        // 上記で配列に格納された商品チェックアウト処理を並列実行
        return Promise.all(promises)
      })
      .then(() => {
        store.cart.setAll([]) // カートを空にする
        store.cart.setCheckoutStatus(CheckoutStatus.Successful)
      })
      .catch(err => {
        store.cart.setCheckoutStatus(CheckoutStatus.Failed)
      })
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

  /**
   * チェックアウト処理による指定された商品の在庫更新を行います。
   * @param transaction
   * @param cartItem
   */
  m_createCheckoutProcess(transaction: Transaction, cartItem: { id: string; quantity: number }): Promise<Transaction> {
    const ref = this.db.collection('products').doc(cartItem.id)
    return transaction.get(ref).then(doc => {
      // 商品が存在しなかった場合、エラーをスロー
      if (!doc.exists) {
        throw new Error(`Product "${cartItem.id}" does not exist.`)
      }
      // 取得した商品の在庫から今回購入される数量をマイナスする
      const latestProduct = doc.data() as Product
      const inventory = latestProduct.inventory - cartItem.quantity
      // 商品の在庫が足りなかったらエラーをスロー
      if (inventory < 0) {
        throw new Error(`The inventory of the product "${cartItem.id}" was insufficient.`)
      }
      // 在庫更新を実行
      return transaction.update(ref, { inventory })
    })
  }
}
