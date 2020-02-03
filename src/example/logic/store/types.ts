import { LibStoreContainer, StatePartial } from '@/lib'

//========================================================================
//
//  Modules
//
//========================================================================

export interface StoreContainer extends LibStoreContainer {
  readonly product: ProductStore

  readonly cart: CartStore
}

export interface ProductStore {
  readonly all: Product[]

  getById(productId: string): Product | undefined

  set(product: StatePartial<Product>): Product | undefined

  setAll(products: Product[]): void

  add(product: Product): Product

  decrementStock(productId: string): void

  incrementStock(productId: string): void
}

export interface CartStore {
  readonly all: CartItem[]

  readonly totalPrice: number

  readonly checkoutStatus: CheckoutStatus

  getById(id: string): CartItem | undefined

  getByProductId(productId: string): CartItem | undefined

  set(item: StatePartial<Omit<CartItem, 'uid' | 'productId'>>): CartItem | undefined

  setAll(items: CartItem[]): void

  setCheckoutStatus(status: CheckoutStatus): void

  add(item: CartItem): CartItem

  remove(id: string): CartItem | undefined

  clear(): void
}

//========================================================================
//
//  Value objects
//
//========================================================================

export interface Product {
  id: string
  title: string
  price: number
  stock: number
}

export interface CartItem {
  id: string
  uid: string
  productId: string
  title: string
  price: number
  quantity: number
}

//========================================================================
//
//  Enumerations
//
//========================================================================

export enum CheckoutStatus {
  None = 'none',
  Failed = 'failed',
  Successful = 'successful',
}

//========================================================================
//
//  Errors
//
//========================================================================

export enum CartModuleErrorType {
  ItemNotFound = 'itemNotFound',
}

export enum ProductsErrorType {
  ItemNotFound = 'itemNotFound',
}

//========================================================================
//
//  States
//
//========================================================================

export interface ProductState {
  all: Product[]
}

export interface CartState {
  all: CartItem[]
  checkoutStatus: CheckoutStatus
}
