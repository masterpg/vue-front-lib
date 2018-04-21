import ShopApi from '../../api/shop-api';
import { ADD_PRODUCT_TO_CART, CartGetters, CartProduct, CartState, CHECKOUT, CheckoutStatus, DECREMENT_PRODUCT_INVENTORY, INCREMENT_ITEM_QUANTITY, Product, PUSH_PRODUCT_TO_CART, RootState, SET_CART_ITEMS, SET_CHECKOUT_STATUS } from '../base';
import { ActionContext } from 'vuex';

//----------------------------------------------------------------------
//
//  State
//
//----------------------------------------------------------------------

const __state: CartState = {
  added: [],
  checkoutStatus: CheckoutStatus.None,
};

//----------------------------------------------------------------------
//
//  Getters
//
//----------------------------------------------------------------------

const __getters = {
  checkoutStatus(state: CartState): string | null {
    return state.checkoutStatus;
  },

  cartProducts(state: CartState, getters: CartGetters, rootState: RootState): CartProduct[] {
    return state.added.map(({ id, quantity }) => {
      const product = rootState.products.all.find((item) => item.id === id);
      return {
        id: product!.id,
        title: product!.title,
        price: product!.price,
        quantity,
      };
    });
  },

  cartTotalPrice(state: CartState, getters: CartGetters): number {
    return getters.cartProducts.reduce((total, product) => {
      return total + product.price * product.quantity;
    }, 0);
  },
};

//----------------------------------------------------------------------
//
//  Mutations
//
//----------------------------------------------------------------------

const __mutations = {
  [PUSH_PRODUCT_TO_CART](state: CartState, { id }: { id: number }) {
    state.added.push({
      id,
      quantity: 1,
    });
  },

  [INCREMENT_ITEM_QUANTITY](state: CartState, { id }: { id: number }) {
    const cartItem = state.added.find((item) => item.id === id);
    if (cartItem) {
      cartItem.quantity++;
    }
  },

  [SET_CART_ITEMS](state: CartState, { items }: { items: Array<{ id: number, quantity: number }> }) {
    state.added = items;
  },

  [SET_CHECKOUT_STATUS](state: CartState, status: CheckoutStatus) {
    state.checkoutStatus = status;
  },
};

//----------------------------------------------------------------------
//
//  Actions
//
//----------------------------------------------------------------------

const __actions = {
  [CHECKOUT](context: ActionContext<CartState, RootState>, products: Product[]): Promise<void> {
    const savedCartItems = [...__state.added];
    context.commit(SET_CHECKOUT_STATUS, CheckoutStatus.None);
    // empty cart
    context.commit(SET_CART_ITEMS, { items: [] });

    return ShopApi.buyProducts(products).then(() => {
      context.commit(SET_CHECKOUT_STATUS, CheckoutStatus.Successful);
    }).catch((err) => {
      context.commit(SET_CHECKOUT_STATUS, CheckoutStatus.Failed);
      // rollback to the cart saved before sending the request
      context.commit(SET_CART_ITEMS, { items: savedCartItems });
    });
  },

  [ADD_PRODUCT_TO_CART](context: ActionContext<CartState, RootState>, product: Product): Promise<void> {
    return new Promise((resolve) => {
      context.commit(SET_CHECKOUT_STATUS, CheckoutStatus.None);
      if (product.inventory > 0) {
        const cartItem = __state.added.find((item) => item.id === product.id);
        if (!cartItem) {
          context.commit(PUSH_PRODUCT_TO_CART, { id: product.id });
        } else {
          context.commit(INCREMENT_ITEM_QUANTITY, cartItem);
        }
        // remove 1 item from stock
        context.commit(DECREMENT_PRODUCT_INVENTORY, { id: product.id });
      }
      resolve();
    });
  },
};

//----------------------------------------------------------------------
//
//  Export
//
//----------------------------------------------------------------------

const CartModule = {
  state: __state,
  getters: __getters,
  mutations: __mutations,
  actions: __actions,
};
export default CartModule;
