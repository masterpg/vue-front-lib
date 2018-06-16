import { CartStore, CartProduct, CheckoutStatus, Product } from '../types';
import { BaseStore } from '../base';
import { Component } from 'vue-property-decorator';

export interface CartState {
  added: Array<{ id: string; quantity: number }>;
  checkoutStatus: CheckoutStatus;
}

@Component
class CartStoreImpl extends BaseStore<CartState> implements CartStore {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super();
    this.initState({
      added: [],
      checkoutStatus: CheckoutStatus.None,
    });
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get checkoutStatus(): CheckoutStatus {
    return this.state.checkoutStatus;
  }

  get cartProducts(): CartProduct[] {
    const allProducts = this.$stores.product.allProducts;
    return this.state.added.map(({ id, quantity }) => {
      const product = allProducts.find((item) => item.id === id);
      return {
        id: product!.id,
        title: product!.title,
        price: product!.price,
        quantity,
      };
    });
  }

  get cartTotalPrice(): number {
    return this.cartProducts.reduce((total, product) => {
      return total + product.price * product.quantity;
    }, 0);
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  getCartProductById(productId: string): CartProduct | undefined {
    const product = this.getProductById(productId);
    const cartProduct = this.state.added.find((item) => {
      return item.id === productId;
    });
    if (!cartProduct) return undefined;
    return {
      id: cartProduct.id,
      title: product.title,
      price: product.price,
      quantity: cartProduct.quantity,
    };
  }

  addProductToCart(productId: string): void {
    const product = this.getProductById(productId);
    this.state.checkoutStatus = CheckoutStatus.None;
    if (product.inventory > 0) {
      const cartItem = this.state.added.find((item) => item.id === product.id);
      if (!cartItem) {
        this.pushProductToCart(product.id);
      } else {
        this.incrementItemQuantity(cartItem.id);
      }
      // 在庫を1つ減らす
      this.$stores.product.decrementProductInventory(product.id);
    }
  }

  checkout(products: Array<{ id: string; quantity: number }>): Promise<void> {
    const savedCartItems = [...this.state.added];
    this.state.checkoutStatus = CheckoutStatus.None;
    // カートを空にする
    this.state.added = [];

    return this.$apis.shop
      .buyProducts(products)
      .then(() => {
        this.state.checkoutStatus = CheckoutStatus.Successful;
      })
      .catch((err) => {
        this.state.checkoutStatus = CheckoutStatus.Failed;
        // カートの内容をAPIリクエス前の状態にロールバックする
        this.state.added = savedCartItems;
      });
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private pushProductToCart(productId: string): void {
    this.state.added.push({
      id: productId,
      quantity: 1,
    });
  }

  private incrementItemQuantity(productId: string): void {
    const cartItem = this.state.added.find((item) => item.id === productId);
    if (cartItem) {
      cartItem.quantity++;
    }
  }

  private getProductById(productId: string): Product {
    const result = this.$stores.product.getProductById(productId);
    if (!result) {
      throw new Error(
        `A Product that matches the specified productId \`${productId}\` was not found.`,
      );
    }
    return result;
  }
}

export function newCartStore(): CartStore {
  return new CartStoreImpl();
}
