import { Product as APIProduct } from '../apis/types';

//----------------------------------------------------------------------
//
//  Stores
//
//----------------------------------------------------------------------

export interface Stores {
  readonly product: ProductStore;

  readonly cart: CartStore;
}

export interface ProductStore {
  readonly allProducts: Product[];

  getProductById(productId: number): Product | undefined;

  decrementProductInventory(productId: number): void;

  getAllProducts(): Promise<void>;
}

export interface CartStore {
  readonly checkoutStatus: CheckoutStatus;

  readonly cartProducts: CartProduct[];

  readonly cartTotalPrice: number;

  getCartProductById(productId): CartProduct | undefined;

  checkout(products: Array<{ id: number; quantity: number }>): Promise<void>;

  addProductToCart(productId: number): void;
}

//----------------------------------------------------------------------
//
//  Entities
//
//----------------------------------------------------------------------

export type Product = APIProduct;

export interface CartProduct {
  id: number;
  title: string;
  price: number;
  quantity: number;
}

//----------------------------------------------------------------------
//
//  Enumerations
//
//----------------------------------------------------------------------

export enum CheckoutStatus {
  None = 'none',
  Failed = 'failed',
  Successful = 'successful',
}
