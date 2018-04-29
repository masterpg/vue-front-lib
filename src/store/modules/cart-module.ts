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
    return this.state.added.map(({ id, quantity }) => {
      const product = this.$appStore.products.allProducts.find((item) => item.id === id);
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

  pushProductToCart(productId: number): void {
    this.state.added.push({
      id: productId,
      quantity: 1,
    });
  }

  incrementItemQuantity(productId: number): void {
    const cartItem = this.state.added.find((item) => item.id === productId);
    if (cartItem) {
      cartItem.quantity++;
    }
  }

  setCartItems(items: Array<{ id: number, quantity: number }>): void {
    this.state.added = items;
  }

  setCheckoutStatus(status: CheckoutStatus): void {
    this.state.checkoutStatus = status;
  }

  checkout(products: Product[]): Promise<void> {
    const savedCartItems = [...this.state.added];
    this.setCheckoutStatus(CheckoutStatus.None);
    // empty cart
    this.setCartItems([]);

    return shopApi.buyProducts(products).then(() => {
      this.setCheckoutStatus(CheckoutStatus.Successful);
    }).catch((err) => {
      this.setCheckoutStatus(CheckoutStatus.Failed);
      // rollback to the cart saved before sending the request
      this.setCartItems(savedCartItems);
    });
  }

  addProductToCart(product: Product): Promise<void> {
    return new Promise((resolve) => {
      this.setCheckoutStatus(CheckoutStatus.None);
      if (product.inventory > 0) {
        const cartItem = this.state.added.find((item) => item.id === product.id);
        if (!cartItem) {
          this.pushProductToCart(product.id);
        } else {
          this.incrementItemQuantity(cartItem.id);
        }
        // remove 1 item from stock
        this.$appStore.products.decrementProductInventory(product.id);
      }
      resolve();
    });
  }

}
