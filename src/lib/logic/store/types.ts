import { Dayjs } from 'dayjs'
import { StorageNode } from '../api'

//========================================================================
//
//  Modules
//
//========================================================================

export interface UserStore extends User {
  set(user: Partial<User>): void

  clear(): void

  clone(): User

  reflectCustomToken(): Promise<void>
}

export interface StorageStore {
  readonly all: StorageNode[]

  get(path: string): StorageNode | undefined

  getById(id: string): StorageNode | undefined

  getChildren(dirPath?: string): StorageNode[]

  getDirChildren(dirPath?: string): StorageNode[]

  getDescendants(dirPath?: string): StorageNode[]

  getDirDescendants(dirPath?: string): StorageNode[]

  getMap(): { [path: string]: StorageNode }

  addList(nodes: StorageNode[]): StorageNode[]

  add(value: StorageNode): StorageNode

  setAll(values: StorageNode[]): void

  setList(nodes: StorageNodeForSet[]): StorageNode[]

  set(node: StorageNodeForSet): StorageNode

  removeList(paths: string[]): StorageNode[]

  remove(path: string): StorageNode[]

  move(fromPath, toPath: string): StorageNode[]

  rename(path: string, newName: string): StorageNode[]

  clone(value: StorageNode): StorageNode

  clear(): void

  /**
   * ノード配列をディレクトリ階層に従ってソートします。
   * @param values
   */
  sort(values: StorageNode[]): StorageNode[]

  /**
   * ノード配列をディレクトリ階層に従ってソートするための関数です。
   * @param a
   * @param b
   */
  sortFunc(a: StorageNode, b: StorageNode): number
}

export interface UserStorageStore extends StorageStore {}

export interface AppStorageStore extends StorageStore {}

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
  myDirName: string
  /**
   * セキュリティ安全なアプリケーション管理者フラグを取得します。
   * `isAppAdmin`でも同様の値を取得できますが、このプロパティは
   * ブラウザの開発ツールなどで設定値を変更できてしまいます。
   * このメソッドは暗号化されたトークンから値を取得しなおすため、
   * 改ざんの心配がない安全な値を取得できます。
   */
  getIsAppAdmin(): Promise<boolean>
}

export type StorageNodeForSet = Partial<Omit<StorageNode, 'nodeType'>> & {
  id: string
}

//========================================================================
//
//  Constants
//
//========================================================================

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
