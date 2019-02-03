import {Product as APIProduct} from '@/apis'

//----------------------------------------------------------------------
//
//  Modules
//
//----------------------------------------------------------------------

export interface AppStore {
  readonly auth: AuthModule

  readonly product: ProductModule

  readonly cart: CartModule
}
export interface AuthModule {
  readonly account: Account

  checkSingedIn(): Promise<void>

  signInWithGoogle(): Promise<void>

  signInWithFacebook(): Promise<void>

  signInWithEmailAndPassword(email: string, password: string): Promise<{result: boolean; errorMessage: string}>

  sendEmailVerification(continueURL: string): Promise<void>

  sendPasswordResetEmail(email: string, continueURL: string): Promise<void>

  createUserWithEmailAndPassword(email: string, password, profile: {displayName: string; photoURL: string | null}): Promise<void>

  signOut(): Promise<void>

  deleteAccount(): Promise<void>

  updateEmail(newEmail: string): Promise<void>

  fetchSignInMethodsForEmail(email: string): Promise<AuthProviderType[]>
}

export interface ProductModule {
  readonly allProducts: Product[]

  getProductById(productId: string): Product | undefined

  decrementProductInventory(productId: string): void

  pullAllProducts(): Promise<void>
}

export interface CartModule {
  readonly checkoutStatus: CheckoutStatus

  readonly cartItems: CartItem[]

  readonly cartTotalPrice: number

  getCartItemById(productId: string): CartItem | undefined

  checkout(): Promise<void>

  addProductToCart(productId: string): void
}

//----------------------------------------------------------------------
//
//  Entities
//
//----------------------------------------------------------------------

export interface Account {
  isSignedIn: boolean
  displayName: string
  photoURL: string
  emailVerified: boolean
}

export type Product = APIProduct

export interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
}

//----------------------------------------------------------------------
//
//  Enumerations
//
//----------------------------------------------------------------------

export enum AuthProviderType {
  Google = 'google.com',
  Password = 'password',
}

export enum CheckoutStatus {
  None = 'none',
  Failed = 'failed',
  Successful = 'successful',
}
