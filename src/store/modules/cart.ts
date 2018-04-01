import shop from '../../api/shop';
import { BaseManager, CartState, Product, RootState } from "./base";
import { ActionContext } from "vuex";

//================================================================================
//
//  Module
//
//================================================================================

//----------------------------------------------------------------------
//
//  State
//
//----------------------------------------------------------------------

const state: CartState = {
  added: [],
  checkoutStatus: null,
};

//----------------------------------------------------------------------
//
//  Getters
//
//----------------------------------------------------------------------

interface CartGetters {
  readonly checkoutStatus: string | null;
  readonly cartProducts: {
    title: string,
    price: number,
    quantity: number,
  }[];
  readonly cartTotalPrice: number;
}

const getters = {
  checkoutStatus: (state: CartState) => state.checkoutStatus,

  cartProducts: (state: CartState, getters: CartGetters, rootState: RootState) => {
    return state.added.map(({ id, quantity }) => {
      const product = rootState.products.all.find(product => product.id === id);
      return {
        title: product!.title,
        price: product!.price,
        quantity,
      };
    });
  },

  cartTotalPrice: (state: CartState, getters: CartGetters) => {
    return getters.cartProducts.reduce((total, product) => {
      return total + product.price * product.quantity;
    }, 0);
  },
};

//----------------------------------------------------------------------
//
//  Actions
//
//----------------------------------------------------------------------

const actions = {
  checkout(context: ActionContext<CartState, RootState>, products: Product[]) {
    const savedCartItems = [...state.added];
    context.commit('setCheckoutStatus', null);
    // empty cart
    context.commit('setCartItems', { items: [] });
    shop.buyProducts(
      products,
      () => context.commit('setCheckoutStatus', 'successful'),
      () => {
        context.commit('setCheckoutStatus', 'failed');
        // rollback to the cart saved before sending the request
        context.commit('setCartItems', { items: savedCartItems });
      },
    );
  },

  addProductToCart(context: ActionContext<CartState, RootState>, product: Product) {
    context.commit('setCheckoutStatus', null);
    if (product.inventory > 0) {
      const cartItem = state.added.find(item => item.id === product.id);
      if (!cartItem) {
        context.commit('pushProductToCart', { id: product.id });
      } else {
        context.commit('incrementItemQuantity', cartItem);
      }
      // remove 1 item from stock
      context.commit('decrementProductInventory', { id: product.id });
    }
  },
};

//----------------------------------------------------------------------
//
//  Mutations
//
//----------------------------------------------------------------------

const mutations = {
  pushProductToCart(state: CartState, { id }: { id: number }) {
    state.added.push({
      id,
      quantity: 1,
    });
  },

  incrementItemQuantity(state: CartState, { id }: { id: number }) {
    const cartItem = state.added.find(item => item.id === id);
    if (cartItem) {
      cartItem.quantity++;
    }
  },

  setCartItems(state: CartState, { items }: { items: { id: number, quantity: number }[] }) {
    state.added = items;
  },

  setCheckoutStatus(state: CartState, status: string | null) {
    state.checkoutStatus = status;
  },
};

//----------------------------------------------------------------------
//
//  Export
//
//----------------------------------------------------------------------

export const CartModule = {
  state,
  getters,
  actions,
  mutations,
};

//================================================================================
//
//  Manager
//
//================================================================================

export class CartManager extends BaseManager implements CartState, CartGetters {

  get added(): { id: number, quantity: number }[] { return this.store.state.cart.added; }

  get checkoutStatus(): string | null { return (<CartGetters>this.store.getters).checkoutStatus; }

  get cartProducts(): {
    title: string,
    price: number,
    quantity: number,
  }[] {
    return (<CartGetters>this.store.getters).cartProducts;
  }

  get cartTotalPrice(): number { return (<CartGetters>this.store.getters).cartTotalPrice; }

  addProductToCart(product: Product): Promise<void> {
    return this.store.dispatch('addProductToCart', product);
  }

  checkout(products: Product[]): Promise<void> {
    return this.store.dispatch('checkout', products);
  }
}
