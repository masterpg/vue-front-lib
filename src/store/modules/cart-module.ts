import shopApi from '../../api/shop-api';
import { ActionContext } from '../base';
import { INCREMENT_ITEM_QUANTITY, mutations, PUSH_PRODUCT_TO_CART, SET_CART_ITEMS, SET_CHECKOUT_STATUS } from '../mutations';
import { actions, ADD_PRODUCT_TO_CART, CHECKOUT } from '../actions';
import { CartState, RootState } from '../states';
import { CartProduct, CheckoutStatus, Product } from '../entities';
import { CartGetters } from '../getters';

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
  [PUSH_PRODUCT_TO_CART](state: CartState, productId: number) {
    state.added.push({
      id: productId,
      quantity: 1,
    });
  },

  [INCREMENT_ITEM_QUANTITY](state: CartState, productId: number) {
    const cartItem = state.added.find((item) => item.id === productId);
    if (cartItem) {
      cartItem.quantity++;
    }
  },

  [SET_CART_ITEMS](state: CartState, items: Array<{ id: number, quantity: number }>) {
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

type Context = ActionContext<CartState, RootState, CartGetters>;

const __actions = {
  [CHECKOUT](context: Context, products: Product[]): Promise<void> {
    const savedCartItems = [...__state.added];
    mutations.setCheckoutStatus(context, CheckoutStatus.None);
    // empty cart
    mutations.setCartItems(context, []);

    return shopApi.buyProducts(products).then(() => {
      mutations.setCheckoutStatus(context, CheckoutStatus.Successful);
    }).catch((err) => {
      mutations.setCheckoutStatus(context, CheckoutStatus.Failed);
      // rollback to the cart saved before sending the request
      mutations.setCartItems(context, savedCartItems);
    });
  },

  [ADD_PRODUCT_TO_CART](context: Context, product: Product): Promise<void> {
    return new Promise((resolve) => {
      mutations.setCheckoutStatus(context, CheckoutStatus.None);
      if (product.inventory > 0) {
        const cartItem = __state.added.find((item) => item.id === product.id);
        if (!cartItem) {
          mutations.pushProductToCart(context, product.id);
        } else {
          mutations.incrementItemQuantity(context, cartItem.id);
        }
        // remove 1 item from stock
        mutations.decrementProductInventory(context, product.id);
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

const cartModule = {
  state: __state,
  getters: __getters,
  mutations: __mutations,
  actions: __actions,
};
export default cartModule;