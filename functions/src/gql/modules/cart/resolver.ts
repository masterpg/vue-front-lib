import * as firebaseAdmin from 'firebase-admin'
import { AddCartItemInput, CartItem, Product, UpdateCartItemInput } from '../types'
import { Arg, Authorized, Ctx, ID, Mutation, Query, Resolver } from 'type-graphql'
import { DocumentReference, Transaction } from '@google-cloud/firestore'
import { Context } from '../../types'
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
  async cartItems(@Ctx() ctx: Context): Promise<CartItem[]> {
    const db = firebaseAdmin.firestore()

    const snapshot = await db
      .collection('cart')
      .where('userId', '==', ctx.user.uid)
      .get()

    const result: CartItem[] = []
    snapshot.forEach(doc => {
      result.push(assign({ id: doc.id }, doc.data()))
    })
    return result
  }

  @Authorized()
  @Mutation(returns => [CartItem])
  async addCartItems(@Arg('items', returns => [AddCartItemInput]) items: AddCartItemInput[], @Ctx() ctx: Context): Promise<CartItem[]> {
    const db = firebaseAdmin.firestore()
    return await db.runTransaction(async transaction => {
      const promises: Promise<CartItem>[] = []
      for (const item of items) {
        promises.push(this.m_addCartItem(transaction, item, ctx.user.uid))
      }
      return await Promise.all<CartItem>(promises)
    })
  }

  @Authorized()
  @Mutation(returns => [CartItem])
  async updateCartItems(@Arg('items', returns => [UpdateCartItemInput]) items: UpdateCartItemInput[], @Ctx() ctx: Context): Promise<CartItem[]> {
    const db = firebaseAdmin.firestore()
    return await db.runTransaction(async transaction => {
      const promises: Promise<CartItem>[] = []
      for (const item of items) {
        promises.push(this.m_updateCartItem(transaction, item, ctx.user.uid))
      }
      return await Promise.all<CartItem>(promises)
    })
  }

  @Authorized()
  @Mutation(returns => [CartItem])
  async removeCartItems(@Arg('cartItemIds', returns => [ID]) cartItemIds: string[], @Ctx() ctx: Context): Promise<CartItem[]> {
    const db = firebaseAdmin.firestore()
    return await db.runTransaction(async transaction => {
      const promises: Promise<CartItem>[] = []
      for (const cartItemId of cartItemIds) {
        promises.push(this.m_removeCartItem(transaction, cartItemId, ctx.user.uid))
      }
      return await Promise.all<CartItem>(promises)
    })
  }

  @Authorized()
  @Mutation(returns => Boolean)
  async checkoutCart(@Ctx() ctx: Context): Promise<boolean> {
    const db = firebaseAdmin.firestore()

    const snapshot = await db
      .collection('cart')
      .where('userId', '==', ctx.user.uid)
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

  private async m_getProductById(transaction: Transaction, id: string): Promise<{ ref: DocumentReference; data: Product }> {
    const db = firebaseAdmin.firestore()
    const ref = db.collection('products').doc(id)
    const doc = await transaction.get(ref)
    if (!doc.exists) {
      throw new Error(`Product "${id}" was not found.`)
    }
    return {
      ref,
      data: assign({ id: ref.id }, doc.data()) as Product,
    }
  }

  private async m_getCartItemById(transaction: Transaction, id: string): Promise<{ ref: DocumentReference; data: CartItem }> {
    const db = firebaseAdmin.firestore()
    const ref = db.collection('cart').doc(id)
    const doc = await transaction.get(ref)
    if (!doc.exists) {
      throw new Error(`Cart item "${id}" was not found.`)
    }
    return {
      ref: ref,
      data: assign({ id: ref.id }, doc.data()) as CartItem,
    }
  }

  /**
   * カートにアイテムを追加します。
   * @param transaction
   * @param itemInput
   * @param userId
   */
  private async m_addCartItem(transaction: Transaction, itemInput: AddCartItemInput, userId: string): Promise<CartItem> {
    const db = firebaseAdmin.firestore()

    // 商品の取得
    const product = await this.m_getProductById(transaction, itemInput.productId)

    // 追加しようとするカートアイテムが存在しないことをチェック
    const query = db
      .collection('cart')
      .where('userId', '==', userId)
      .where('productId', '==', itemInput.productId)
    const snapshot = await transaction.get(query)
    if (snapshot.size > 0) {
      throw new Error('The specified cart item already exists.')
    }

    // カートアイテムの追加内容を作成
    const cartItemRef = db.collection('cart').doc()
    const newCartItem = {
      userId,
      productId: itemInput.productId,
      title: itemInput.title,
      price: itemInput.price,
      quantity: itemInput.quantity,
    }

    // 商品の在庫数を設定
    const newStock = product.data.stock - itemInput.quantity
    if (newStock < 0) {
      throw new Error(`The stock of the product "${itemInput.productId}" was insufficient.`)
    }

    // カートアイテム追加を実行
    transaction.create(cartItemRef, newCartItem)
    // 商品の在庫更新を実行
    transaction.update(product.ref, { stock: newStock })

    return assign({ id: cartItemRef.id }, newCartItem) as CartItem
  }

  /**
   * カートにアイテムを追加します。
   * @param transaction
   * @param itemInput
   * @param userId
   */
  private async m_updateCartItem(transaction: Transaction, itemInput: UpdateCartItemInput, userId: string): Promise<CartItem> {
    // カートアイテムを取得
    const cartItem = await this.m_getCartItemById(transaction, itemInput.id)
    // 取得したカートアイテムが自身のものかチェック
    if (cartItem.data.userId !== userId) {
      throw new Error('You can not access the specified cart item.')
    }
    // 商品の取得
    const product = await this.m_getProductById(transaction, cartItem.data.productId)
    // カートアイテムの更新内容を作成
    const newCartItem = {
      quantity: itemInput.quantity,
    }
    // 商品の在庫数を再計算
    const newStock = product.data.stock - (itemInput.quantity - cartItem.data.quantity)
    if (newStock < 0) {
      throw new Error(`The stock of the product "${product.data.id}" was insufficient.`)
    }
    // カートアイテム更新を実行
    transaction.set(cartItem.ref, newCartItem, { merge: true })
    // 商品の在庫更新を実行
    transaction.update(product.ref, { stock: newStock })

    return assign(cartItem.data, newCartItem) as CartItem
  }

  /**
   * カートからアイテムを削除します。
   * @param transaction
   * @param cartItemId
   * @param userId
   */
  private async m_removeCartItem(transaction: Transaction, cartItemId: string, userId: string): Promise<CartItem> {
    // カートアイテムを取得
    const cartItem = await this.m_getCartItemById(transaction, cartItemId)
    // 取得したカートアイテムが自身のものかチェック
    if (cartItem.data.userId !== userId) {
      throw new Error('You can not access the specified cart item.')
    }
    // 商品の取得
    const product = await this.m_getProductById(transaction, cartItem.data.productId)
    // 取得した商品の在庫に今回削除分をプラスする
    const newStock = product.data.stock + cartItem.data.quantity
    // カートアイテムの削除を実行
    transaction.delete(cartItem.ref)
    // 商品の在庫更新を実行
    transaction.update(product.ref, { stock: newStock })

    return cartItem.data
  }
}
