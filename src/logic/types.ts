import { CartItem, CheckoutStatus, Product, User } from '@/store'
import { GQLStorageNodeType as StorageNodeType } from '@/gql'

//----------------------------------------------------------------------
//
//  Logic
//
//----------------------------------------------------------------------

export interface Logic {
  readonly storage: StorageLogic
  readonly shop: ShopLogic
  readonly auth: AuthLogic
}

export interface StorageLogic {
  toURL(path: string): string

  getUserNodes(dir?: string): Promise<StorageNodeBag>

  createStorageDir(dirPath: string): Promise<StorageNodeBag>

  removeStorageNodes(nodePaths: string[]): Promise<StorageNodeBag>
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
//  Value objects
//
//----------------------------------------------------------------------

export interface StorageNodeBag {
  list: StorageNode[]
  map: { [path: string]: StorageNode }
}

export interface StorageNode {
  nodeType: StorageNodeType
  name: string
  dir: string
  path: string
  parent?: StorageNode
  children: StorageNode[]
}

//----------------------------------------------------------------------
//
//  Enumerations
//
//----------------------------------------------------------------------

export enum AuthProviderType {
  Google = 'google.com',
  Facebook = 'facebook.com',
  Password = 'password',
  Anonymous = 'anonymous',
}

export { StorageNodeType, CartItem, CheckoutStatus, Product, User }
