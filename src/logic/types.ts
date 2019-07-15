import { Account, CartItem, CheckoutStatus, Product } from '@/store'

//----------------------------------------------------------------------
//
//  Logic
//
//----------------------------------------------------------------------

export interface Logic {
  readonly shop: ShopLogic
  readonly auth: AuthLogic
}

export interface ShopLogic {
  products: Product[]

  pullProducts(): Promise<void>

  cartItems: CartItem[]

  cartTotalPrice: number

  checkoutStatus: CheckoutStatus

  addProductToCart(productId: string): void

  checkout(): Promise<void>
}

export interface AuthLogic {
  readonly account: Account

  checkSingedIn(): Promise<void>

  signInWithGoogle(): Promise<void>

  signInWithFacebook(): Promise<void>

  signInWithEmailAndPassword(email: string, password: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  signInAnonymously(): Promise<{ result: boolean; code: string; errorMessage: string }>

  sendEmailVerification(continueURL: string): Promise<void>

  sendPasswordResetEmail(email: string, continueURL: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  createUserWithEmailAndPassword(
    email: string,
    password,
    profile: { displayName: string; photoURL: string | null }
  ): Promise<{ result: boolean; code: string; errorMessage: string }>

  signOut(): Promise<void>

  deleteAccount(): Promise<{ result: boolean; code: string; errorMessage: string }>

  updateEmail(newEmail: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  fetchSignInMethodsForEmail(email: string): Promise<AuthProviderType[]>
}

//----------------------------------------------------------------------
//
//  Enumerations
//
//----------------------------------------------------------------------

enum AuthProviderType {
  Google = 'google.com',
  Facebook = 'facebook.com',
  Password = 'password',
  Anonymous = 'anonymous',
}

export { Account, AuthProviderType, CartItem, CheckoutStatus, Product }
