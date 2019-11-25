import { APIStorageNode, APIStorageNodeType as StorageNodeType } from '../api'

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

export interface StorageModule {
  readonly all: StorageNode[]

  getMap(): { [path: string]: StorageNode }

  add(value: StorageNode): StorageNode

  addList(nodes: StorageNode[]): StorageNode[]

  setAll(values: StorageNode[]): void

  clone(value: StorageNode): StorageNode

  remove(path: string): StorageNode[]

  /**
   * ノード配列をディレクトリ階層に従ってソートします。
   * @param values
   */
  sort(values: StorageNode[]): void

  /**
   * ノード配列をディレクトリ階層に従ってソートするための関数です。
   * @param a
   * @param b
   */
  sortFunc(a: StorageNode, b: StorageNode): number
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

export interface StorageNode extends APIStorageNode {}

//========================================================================
//
//  Constants
//
//========================================================================

export { StorageNodeType }

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

export interface StorageState {
  all: StorageNode[]
}
