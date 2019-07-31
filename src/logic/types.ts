import { CartItem, CheckoutStatus, Product, User } from '@/store'

//----------------------------------------------------------------------
//
//  Logic
//
//----------------------------------------------------------------------

export interface Logic {
  readonly shop: ShopLogic
  readonly auth: AuthLogic
  readonly hello: HelloLogic
}

export interface ShopLogic {
  products: Product[]

  pullProducts(): Promise<void>

  cartItems: CartItem[]

  pullCartItems(): Promise<void>

  cartTotalPrice: number

  checkoutStatus: CheckoutStatus

  addItemToCart(productId: string): Promise<void>

  removeItemFromCart(productId: string): Promise<void>

  checkout(): Promise<void>
}

export interface AuthLogic {
  readonly user: User

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

export interface HelloLogic {
  publicHello(message: string): Promise<string>

  siteHello(message: string): Promise<string>

  authHello(message: string): Promise<string>
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

export { AuthProviderType, CartItem, CheckoutStatus, Product, User }
