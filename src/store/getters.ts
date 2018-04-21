import { CartProduct, CheckoutStatus, Product } from './entities';

export interface CartGetters {
  readonly checkoutStatus: CheckoutStatus;
  readonly cartProducts: CartProduct[];
  readonly cartTotalPrice: number;
}

export interface ProductsGetters {
  readonly allProducts: Product[];
}
