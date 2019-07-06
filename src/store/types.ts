//----------------------------------------------------------------------
//
//  Store
//
//----------------------------------------------------------------------

export interface Store {
  readonly products: ProductsModule

  readonly cart: CartModule

  readonly account: AccountModule
}

//----------------------------------------------------------------------
//
//  Modules
//
//----------------------------------------------------------------------

export interface ProductsModule {
  readonly all: Product[]

  getById(productId: string): Product | undefined

  set(product: StatePartial<Product>): Product | undefined

  setAll(products: Product[]): void

  add(product: Product): Product

  decrementInventory(productId: string): void
}

export interface CartModule {
  readonly all: CartItem[]

  readonly totalPrice: number

  readonly checkoutStatus: CheckoutStatus

  setAll(items: CartItem[]): void

  setCheckoutStatus(status: CheckoutStatus): void

  addProductToCart(product: Product): CartItem

  getById(productId: string): CartItem | undefined
}

export interface AccountModule {
  readonly value: Account

  set(account: Partial<Account>): Account
}

//----------------------------------------------------------------------
//
//  Data types
//
//----------------------------------------------------------------------

export type StatePartial<T> = Partial<Omit<T, 'id'>> & { id: string }

export interface Product {
  id: string
  title: string
  price: number
  inventory: number
}

export interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
}

export interface Account {
  isSignedIn: boolean
  displayName: string
  photoURL: string
  emailVerified: boolean
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

//----------------------------------------------------------------------
//
//  Errors
//
//----------------------------------------------------------------------

export class StoreError<T> extends Error {
  constructor(type: T) {
    super()
    this.errorType = type
  }

  errorType: T
}

export enum CartModuleErrorType {
  ItemNotFound = 'itemNotFound',
}

export enum ProductsErrorType {
  ItemNotFound = 'itemNotFound',
}

//----------------------------------------------------------------------
//
//  States
//
//----------------------------------------------------------------------

export interface ProductsState {
  all: Product[]
}

export interface CartState {
  all: CartItem[]
  checkoutStatus: CheckoutStatus
}
