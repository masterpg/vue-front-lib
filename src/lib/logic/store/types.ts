//========================================================================
//
//  Modules
//
//========================================================================

export interface UserModule {
  readonly value: User

  set(user: Partial<User>): User

  clear(): void
}

//========================================================================
//
//  Value objects
//
//========================================================================

export type StatePartial<T> = Partial<Omit<T, 'id'>> & { id: string }

export interface User {
  id: string
  isSignedIn: boolean
  displayName: string
  photoURL: string
  email: string
  emailVerified: boolean
}

//========================================================================
//
//  Errors
//
//========================================================================

export class StoreError<T> extends Error {
  constructor(type: T) {
    super()
    this.errorType = type
  }

  errorType: T
}

//========================================================================
//
//  States
//
//========================================================================

export type UserState = User
