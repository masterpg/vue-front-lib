import { Product as APIProduct } from '../apis/types';

//----------------------------------------------------------------------
//
//  Stores
//
//----------------------------------------------------------------------

export interface Stores {
  readonly auth: AuthStore;

  readonly product: ProductStore;

  readonly cart: CartStore;
}

export interface AuthStore {
  readonly account: Account;

  checkSingedIn(): Promise<void>;

  signInWithGoogle(): Promise<void>;

  signInWithFacebook(): Promise<void>;

  signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<{ result: boolean; errorMessage: string }>;

  sendEmailVerification(continueURL: string): Promise<void>;

  sendPasswordResetEmail(email: string, continueURL: string): Promise<void>;

  createUserWithEmailAndPassword(
    email: string,
    password,
    profile: { displayName: string; photoURL: string | null },
  ): Promise<void>;

  signOut(): Promise<void>;

  deleteAccount(): Promise<void>;

  updateEmail(newEmail: string): Promise<void>;

  fetchSignInMethodsForEmail(email: string): Promise<AuthProviderType[]>;
}

export interface ProductStore {
  readonly allProducts: Product[];

  getProductById(productId: string): Product | undefined;

  decrementProductInventory(productId: string): void;

  getAllProducts(): Promise<void>;
}

export interface CartStore {
  readonly checkoutStatus: CheckoutStatus;

  readonly cartProducts: CartProduct[];

  readonly cartTotalPrice: number;

  getCartProductById(productId: string): CartProduct | undefined;

  checkout(): Promise<void>;

  addProductToCart(productId: string): void;
}

//----------------------------------------------------------------------
//
//  Entities
//
//----------------------------------------------------------------------

export interface Account {
  isSignedIn: boolean;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
}

export type Product = APIProduct;

export interface CartProduct {
  id: string;
  title: string;
  price: number;
  quantity: number;
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
