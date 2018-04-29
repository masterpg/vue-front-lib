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

  setProducts(products: ApiProduct[]): void;

  decrementProductInventory(productId: number): void;

  getAllProducts(): Promise<void>;
}

export interface CartModule {
  readonly checkoutStatus: CheckoutStatus;

  readonly cartProducts: CartProduct[];

  readonly cartTotalPrice: number;

  pushProductToCart(productId: number): void;

  incrementItemQuantity(productId: number): void;

  setCartItems(items: Array<{ id: number, quantity: number }>): void;

  setCheckoutStatus(status: CheckoutStatus): void;

  checkout(products: Product[]): Promise<void>;

  addProductToCart(product: Product): Promise<void>;
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
