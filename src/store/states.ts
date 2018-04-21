import { CheckoutStatus, Product } from './entities';

export interface RootState {
  cart: CartState;
  products: ProductsState;
}

export interface CartState {
  added: Array<{ id: number, quantity: number }>;
  checkoutStatus: CheckoutStatus;
}

export interface ProductsState {
  all: Product[];
}
