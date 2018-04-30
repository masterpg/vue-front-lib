import { Product as ApiProduct } from '../api/shop-api';

//----------------------------------------------------------------------
//
//  Others
//
//----------------------------------------------------------------------

export interface AppStore {
  readonly products: ProductsModule;

  readonly cart: CartModule;
}

//----------------------------------------------------------------------
//
//  Modules
//
//----------------------------------------------------------------------

export interface ProductsModule {
  readonly allProducts: Product[];

  decrementProductInventory(productId: number): void;

  getAllProducts(): Promise<void>;
}

export interface CartModule {
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
