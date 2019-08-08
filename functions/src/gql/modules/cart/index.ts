import * as firebaseAdmin from 'firebase-admin'
import { AddCartItemInput, CartItem, EditCartItemResponse, Product, UpdateCartItemInput } from '../../types'
import { Arg, Authorized, Ctx, ID, Mutation, Query, Resolver } from 'type-graphql'
import { DocumentReference, Transaction } from '@google-cloud/firestore'
import { Context } from '../../types'
import { WriteReadyObserver } from '../../../base/firestore'
const assign = require('lodash/assign')

@Resolver(of => CartItem)
export class CartResolver {
  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  @Authorized()
  @Query(returns => [CartItem])
  async cartItems(@Ctx() ctx: Context, @Arg('ids', returns => [ID], { nullable: true }) ids?: string[]): Promise<CartItem[]> {
    const db = firebaseAdmin.firestore()

    if (ids && ids.length) {
      const promises: Promise<CartItem | undefined>[] = []
      for (const id of ids) {
        promises.push(
          (async () => {
            const doc = await db
              .collection('cart')
              .doc(id)
              .get()
            if (doc.exists) {
              return { id: doc.id, ...doc.data() } as CartItem
            }
            return undefined
          })()
        )
      }
      return (await Promise.all(promises)).reduce(
        (result, item) => {
          if (item && item.uid === ctx.user.uid) {
            result.push(item)
          }
          return result
        },
        [] as CartItem[]
      )
    } else {
      const items: CartItem[] = []
      const snapshot = await db
        .collection('cart')
        .where('uid', '==', ctx.user.uid)
        .get()
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as CartItem)
      })
      return items
    }
  }

  @Authorized()
  @Mutation(returns => [EditCartItemResponse])
  async addCartItems(@Ctx() ctx: Context, @Arg('items', returns => [AddCartItemInput]) items: AddCartItemInput[]): Promise<EditCartItemResponse[]> {
    const db = firebaseAdmin.firestore()
    return await db.runTransaction(async transaction => {
      const writeReady = new WriteReadyObserver(items.length)
      const promises: Promise<EditCartItemResponse>[] = []
      for (const item of items) {
        promises.push(this.m_addCartItem(transaction, item, ctx.user.uid, writeReady))
      }
      return await Promise.all<EditCartItemResponse>(promises)
    })
  }

  @Authorized()
  @Mutation(returns => [EditCartItemResponse])
  async updateCartItems(
    @Ctx() ctx: Context,
    @Arg('items', returns => [UpdateCartItemInput]) items: UpdateCartItemInput[]
  ): Promise<EditCartItemResponse[]> {
    const db = firebaseAdmin.firestore()
    return await db.runTransaction(async transaction => {
      const writeReady = new WriteReadyObserver(items.length)
      const promises: Promise<EditCartItemResponse>[] = []
      for (const item of items) {
        promises.push(this.m_updateCartItem(transaction, item, ctx.user.uid, writeReady))
      }
      return await Promise.all<EditCartItemResponse>(promises)
    })
  }

  @Authorized()
  @Mutation(returns => [EditCartItemResponse])
  async removeCartItems(@Ctx() ctx: Context, @Arg('ids', returns => [ID]) ids: string[]): Promise<EditCartItemResponse[]> {
    const db = firebaseAdmin.firestore()
    return await db.runTransaction(async transaction => {
      const writeReady = new WriteReadyObserver(ids.length)
      const promises: Promise<EditCartItemResponse>[] = []
      for (const cartItemId of ids) {
        promises.push(this.m_removeCartItem(transaction, cartItemId, ctx.user.uid, writeReady))
      }
      return await Promise.all<EditCartItemResponse>(promises)
    })
  }

  @Authorized()
  @Mutation(returns => Boolean)
  async checkoutCart(@Ctx() ctx: Context): Promise<boolean> {
    const db = firebaseAdmin.firestore()

    const snapshot = await db
      .collection('cart')
      .where('uid', '==', ctx.user.uid)
      .get()

    await db.runTransaction(async transaction => {
      snapshot.forEach(doc => {
        transaction.delete(doc.ref)
      })
    })

    return true
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * カートにアイテムを追加します。
   * @param transaction
   * @param itemInput
   * @param uid
   * @param writeReady
   */
  private async m_addCartItem(
    transaction: Transaction,
    itemInput: AddCartItemInput,
    uid: string,
    writeReady: WriteReadyObserver
  ): Promise<EditCartItemResponse> {
    const db = firebaseAdmin.firestore()

    // 商品の取得
    const product = await this.m_getProductById(transaction, itemInput.productId)

    // 追加しようとするカートアイテムが存在しないことをチェック
    const query = db
      .collection('cart')
      .where('uid', '==', uid)
      .where('productId', '==', itemInput.productId)
    const snapshot = await transaction.get(query)
    if (snapshot.size > 0) {
      throw new Error('The specified cart item already exists.')
    }

    // 新規カートアイテムの内容を作成
    const cartItemRef = db.collection('cart').doc()
    const newCartItem = {
      uid,
      productId: itemInput.productId,
      title: itemInput.title,
      price: itemInput.price,
      quantity: itemInput.quantity,
    }

    // 商品の在庫数を設定
    const newStock = product.data.stock - itemInput.quantity
    if (newStock < 0) {
      throw new Error('The stock of the product was insufficient.')
    }

    // 新規カートアイテム追加を実行
    transaction.create(cartItemRef, newCartItem)
    // 商品の在庫数更新を実行
    assign(product.data, { stock: newStock })
    transaction.update(product.ref, product.data)

    return {
      id: cartItemRef.id,
      ...newCartItem,
      product: product.data,
    }
  }

  /**
   * カートのアイテムを更新します。
   * @param transaction
   * @param itemInput
   * @param uid
   * @param writeReady
   */
  private async m_updateCartItem(
    transaction: Transaction,
    itemInput: UpdateCartItemInput,
    uid: string,
    writeReady: WriteReadyObserver
  ): Promise<EditCartItemResponse> {
    // カートアイテムを取得
    const cartItem = await this.m_getCartItemById(transaction, itemInput.id)
    // 取得したカートアイテムが自身のものかチェック
    if (cartItem.data.uid !== uid) {
      throw new Error('You can not access the specified cart item.')
    }
    // 商品の在庫数を再計算
    const product = await this.m_getProductById(transaction, cartItem.data.productId)
    const newStock = product.data.stock - (itemInput.quantity - cartItem.data.quantity)
    if (newStock < 0) {
      throw new Error('The stock of the product was insufficient.')
    }

    // 書き込み準備ができるまで待機
    await writeReady.wait()

    // カートアイテム更新を実行
    assign(cartItem.data, { quantity: itemInput.quantity })
    transaction.set(cartItem.ref, cartItem.data, { merge: true })
    // 商品の在庫数更新を実行
    assign(product.data, { stock: newStock })
    transaction.update(product.ref, product.data)

    return {
      ...cartItem.data,
      product: product.data,
    }
  }

  /**
   * カートからアイテムを削除します。
   * @param transaction
   * @param cartItemId
   * @param uid
   * @param writeReady
   */
  private async m_removeCartItem(
    transaction: Transaction,
    cartItemId: string,
    uid: string,
    writeReady: WriteReadyObserver
  ): Promise<EditCartItemResponse> {
    // カートアイテムを取得
    const cartItem = await this.m_getCartItemById(transaction, cartItemId)
    // 取得したカートアイテムが自身のものかチェック
    if (cartItem.data.uid !== uid) {
      throw new Error('You can not access the specified cart item.')
    }
    // 商品の取得
    const product = await this.m_getProductById(transaction, cartItem.data.productId)
    // 取得した商品の在庫にカートアイテム削除分をプラスする
    const newStock = product.data.stock + cartItem.data.quantity

    // 書き込み準備ができるまで待機
    await writeReady.wait()

    // カートアイテムの削除を実行
    transaction.delete(cartItem.ref)
    // 商品の在庫数更新を実行
    assign(product.data, { stock: newStock })
    transaction.update(product.ref, product.data)

    return {
      ...cartItem.data,
      quantity: 0,
      product: product.data,
    }
  }

  private async m_getProductById(transaction: Transaction, id: string): Promise<{ ref: DocumentReference; data: Product }> {
    const db = firebaseAdmin.firestore()
    const ref = db.collection('products').doc(id)
    const doc = await transaction.get(ref)
    if (!doc.exists) {
      throw new Error('The specified product was not found.')
    }
    return {
      ref,
      data: { id: ref.id, ...doc.data() } as Product,
    }
  }

  private async m_getCartItemById(transaction: Transaction, id: string): Promise<{ ref: DocumentReference; data: CartItem }> {
    const db = firebaseAdmin.firestore()
    const ref = db.collection('cart').doc(id)
    const doc = await transaction.get(ref)
    if (!doc.exists) {
      throw new Error('The specified cart item was not found.')
    }
    return {
      ref: ref,
      data: { id: ref.id, ...doc.data() } as CartItem,
    }
  }

  private async m_sleep(ms: number): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`I slept for ${ms}ms.`)
      }, ms)
    }) as Promise<string>
  }
}
