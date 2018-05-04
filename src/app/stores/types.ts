import { Product as ApiProduct } from '../api/shop-api';

//----------------------------------------------------------------------
//
//  Others
//
//----------------------------------------------------------------------

export interface Stores {
  readonly product: ProductStore;

  readonly cart: CartStore;
}

//----------------------------------------------------------------------
//
//  Stores
//
//----------------------------------------------------------------------

export interface ProductStore {
  readonly allProducts: Product[];

  decrementProductInventory(productId: number): void;

  getAllProducts(): Promise<void>;
}

export interface CartStore {
  readonly checkoutStatus: CheckoutStatus;

  readonly cartProducts: CartProduct[];

  readonly cartTotalPrice: number;

  checkout(products: Product[]): Promise<void>;

  addProductToCart(product: Product): void;
}

//----------------------------------------------------------------------
//
//  Entities
//
//----------------------------------------------------------------------

export type Product = ApiProduct;

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
