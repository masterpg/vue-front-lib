import shopApi from '../../api/shop-api';
import { CartModule, CartProduct, CheckoutStatus, Product } from '../types';
import { BaseModule } from './base';
import { Component } from 'vue-property-decorator';

export default function newCartModule(): CartModule {
  return new CartModuleImpl();
}

interface CartState {
  added: Array<{ id: number, quantity: number }>;
  checkoutStatus: CheckoutStatus;
}

@Component
class CartModuleImpl extends BaseModule<CartState>
  implements CartModule {

  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super();
    this.init({
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
    const allProducts = this.$appStore.products.allProducts;
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

  addProductToCart(product: Product): void {
    this.state.checkoutStatus = CheckoutStatus.None;
    if (product.inventory > 0) {
      const cartItem = this.state.added.find((item) => item.id === product.id);
      if (!cartItem) {
        this.pushProductToCart(product.id);
      } else {
        this.incrementItemQuantity(cartItem.id);
      }
      // 在庫を1つ減らす
      this.$appStore.products.decrementProductInventory(product.id);
    }
  }

  checkout(products: Product[]): Promise<void> {
    const savedCartItems = [...this.state.added];
    this.state.checkoutStatus = CheckoutStatus.None;
    // カートを空にする
    this.state.added = [];

    return shopApi.buyProducts(products).then(() => {
      this.state.checkoutStatus = CheckoutStatus.Successful;
    }).catch((err) => {
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

  private pushProductToCart(productId: number): void {
    this.state.added.push({
      id: productId,
      quantity: 1,
    });
  }

  private incrementItemQuantity(productId: number): void {
    const cartItem = this.state.added.find((item) => item.id === productId);
    if (cartItem) {
      cartItem.quantity++;
    }
  }

}
