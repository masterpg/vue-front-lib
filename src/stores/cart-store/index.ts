import { BaseStore } from '@/stores/base';
import { CartStore, CartItem, CheckoutStatus, Product } from '@/stores/types';
import { Component } from 'vue-property-decorator';
import { NoCache } from '@/base/component';
type Transaction = firebase.firestore.Transaction;

export interface CartState {
  items: Array<{ id: string; quantity: number }>;
  checkoutStatus: CheckoutStatus;
}

@Component
export class CartStoreImpl extends BaseStore<CartState> implements CartStore {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super();
    this.f_initState({
      items: [],
      checkoutStatus: CheckoutStatus.None,
    });
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get checkoutStatus(): CheckoutStatus {
    return this.f_state.checkoutStatus;
  }

  @NoCache
  get cartItems(): CartItem[] {
    const allProducts = this.$stores.product.allProducts;
    return this.f_state.items.map(({ id, quantity }) => {
      const product = allProducts.find((item) => item.id === id)!;
      return {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity,
      };
    });
  }

  get cartTotalPrice(): number {
    return this.cartItems.reduce((total, product) => {
      return total + product.price * product.quantity;
    }, 0);
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getCartItemById(productId: string): CartItem | undefined | null {
    const product = this.m_getProductById(productId);
    const cartItem = this.f_state.items.find((item) => {
      return item.id === productId;
    });
    if (!cartItem) return undefined;
    return {
      id: cartItem.id,
      title: product.title,
      price: product.price,
      quantity: cartItem.quantity,
    };
  }

  addProductToCart(productId: string): void {
    const product = this.m_getProductById(productId);
    this.f_state.checkoutStatus = CheckoutStatus.None;
    if (product.inventory > 0) {
      const cartItem = this.f_state.items.find((item) => item.id === product.id);
      if (!cartItem) {
        this.m_pushProductToCart(product.id);
      } else {
        this.m_incrementItemQuantity(cartItem.id);
      }
      // 在庫を1つ減らす
      this.$stores.product.decrementProductInventory(product.id);
    }
  }

  checkout(): Promise<void> {
    this.f_state.checkoutStatus = CheckoutStatus.None;
    // トランザクション開始
    return this.f_db
      .runTransaction((transaction) => {
        // 配列に商品チェックアウト処理を格納する
        const promises: Array<Promise<any>> = [];
        for (const product of this.f_state.items) {
          const promise = this.m_createCheckoutProcess(transaction, product);
          promises.push(promise);
        }
        // 上記で配列に格納された商品チェックアウト処理を並列実行
        return Promise.all(promises);
      })
      .then(() => {
        this.f_state.items = []; // カートを空にする
        this.f_state.checkoutStatus = CheckoutStatus.Successful;
      })
      .catch((err) => {
        this.f_state.checkoutStatus = CheckoutStatus.Failed;
      });
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  m_pushProductToCart(productId: string): void {
    this.f_state.items.push({
      id: productId,
      quantity: 1,
    });
  }

  m_incrementItemQuantity(productId: string): void {
    const cartItem = this.f_state.items.find((item) => item.id === productId);
    if (cartItem) {
      cartItem.quantity++;
    }
  }

  m_getProductById(productId: string): Product {
    const result = this.$stores.product.getProductById(productId);
    if (!result) {
      throw new Error(`A product that matches the specified productId "${productId}" was not found.`);
    }
    return result;
  }

  /**
   * チェックアウト処理による指定された商品の在庫更新を行います。
   * @param transaction
   * @param product
   */
  m_createCheckoutProcess(
    transaction: Transaction,
    product: { id: string; quantity: number },
  ): Promise<Transaction> {
    const ref = this.f_db.collection('products').doc(product.id);
    return transaction.get(ref).then((doc) => {
      // 商品が存在しなかった場合、エラーをスロー
      if (!doc.exists) {
        throw new Error(`Product "${product.id}" does not exist.`);
      }
      // 取得した商品の在庫から今回購入される数量をマイナスする
      // 商品の在庫が足りなかったらエラーをスロー
      const latestProduct = doc.data() as Product;
      const inventory = latestProduct.inventory - product.quantity;
      if (inventory < 0) {
        throw new Error(`The inventory of the product "${product.id}" was insufficient.`);
      }
      // 在庫更新を実行
      return transaction.update(ref, { inventory });
    });
  }
}

export function newCartStore(): CartStore {
  return new CartStoreImpl();
}
