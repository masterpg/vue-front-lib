import { APIStorageNode, APIStorageNodeType as StorageNodeType } from '../api'

//========================================================================
//
//  Modules
//
//========================================================================

export interface UserModule extends User {
  set(user: Partial<User>): void

  clear(): void

  clone(): User

  reflectCustomToken(): Promise<void>
}

export interface StorageModule {
  readonly all: StorageNode[]

  get(path: string): StorageNode | undefined

  getDescendants(path: string): StorageNode[]

  getMap(): { [path: string]: StorageNode }

  add(value: StorageNode): StorageNode

  addList(nodes: StorageNode[]): StorageNode[]

  setAll(values: StorageNode[]): void

  remove(path: string): StorageNode[]

  rename(path: string, newName: string): StorageNode[]

  set(node: Partial<Omit<StorageNode, 'path'>> & { path: string }, newPath?: string): StorageNode

  clone(value: StorageNode): StorageNode

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
  isAppAdmin: boolean
  storageDir: string
  /**
   * セキュリティ安全なアプリケーション管理者フラグを取得します。
   * `isAppAdmin`でも同様の値を取得できますが、このプロパティは
   * ブラウザの開発ツールなどで設定値を変更できてしまいます。
   * このメソッドでは暗号化されたトークンから値を取得しなおすため、
   * 改ざんの心配がない安全な値を取得できます。
   */
  getIsAppAdmin(): Promise<boolean>
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

export interface StorageState {
  all: StorageNode[]
}
