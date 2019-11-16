import { StatePartial } from '@/lib'

//========================================================================
//
//  Modules
//
//========================================================================

export interface ProductModule {
  readonly all: Product[]

  getById(productId: string): Product | undefined

  set(product: StatePartial<Product>): Product | undefined

  setAll(products: Product[]): void

  add(product: Product): Product

  decrementStock(productId: string): void

  incrementStock(productId: string): void
}

export interface CartModule {
  readonly all: CartItem[]

  readonly totalPrice: number

  readonly checkoutStatus: CheckoutStatus

  set(item: StatePartial<Omit<CartItem, 'uid' | 'productId'>>): CartItem | undefined

  setAll(items: CartItem[]): void

  setCheckoutStatus(status: CheckoutStatus): void

  add(item: CartItem): CartItem

  remove(id: string): CartItem | undefined

  getById(id: string): CartItem | undefined

  getByProductId(productId: string): CartItem | undefined
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
