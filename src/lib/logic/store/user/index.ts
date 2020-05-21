import { BaseStore } from '../base'
import { Component } from 'vue-property-decorator'
import { UserClaims } from '../../api'
import isBoolean from 'lodash/isBoolean'
import isString from 'lodash/isString'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface UserStore extends User {
  set(user: Partial<User>): void

  clear(): void

  clone(): User

  reflectCustomToken(): Promise<void>
}

interface User extends Required<UserClaims> {
  id: string
  isSignedIn: boolean
  displayName: string
  photoURL: string
  email: string
  emailVerified: boolean
  /**
   * セキュリティ安全なアプリケーション管理者フラグを取得します。
   * `isAppAdmin`でも同様の値を取得できますが、このプロパティは
   * ブラウザの開発ツールなどで設定値を変更できてしまいます。
   * このメソッドは暗号化されたトークンから値を取得しなおすため、
   * 改ざんの心配がない安全な値を取得できます。
   */
  getIsAppAdmin(): Promise<boolean>
}

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class UserStoreImpl extends BaseStore<void> implements UserStore {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  private m_id = ''

  get id(): string {
    return this.m_id
  }

  private m_isSignedIn = false

  get isSignedIn(): boolean {
    return this.m_isSignedIn
  }

  private m_displayName = ''

  get displayName(): string {
    return this.m_displayName
  }

  private m_photoURL = ''

  get photoURL(): string {
    return this.m_photoURL
  }

  private m_email = ''

  get email(): string {
    return this.m_email
  }

  private m_emailVerified = false

  get emailVerified(): boolean {
    return this.m_emailVerified
  }

  private m_isAppAdmin = false

  get isAppAdmin(): boolean {
    return this.m_isAppAdmin
  }

  private m_myDirName = ''

  get myDirName(): string {
    return this.m_myDirName
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  set(value: Partial<User>): void {
    if (isString(value.id)) this.m_id = value.id!
    if (isBoolean(value.isSignedIn)) this.m_isSignedIn = value.isSignedIn!
    if (isString(value.displayName)) this.m_displayName = value.displayName!
    if (isString(value.photoURL)) this.m_photoURL = value.photoURL!
    if (isString(value.email)) this.m_email = value.email!
    if (isBoolean(value.emailVerified)) this.m_emailVerified = value.emailVerified!
    if (isBoolean(value.isAppAdmin)) this.m_isAppAdmin = value.isAppAdmin!
    if (isString(value.myDirName)) this.m_myDirName = value.myDirName!
  }

  clear(): void {
    this.set(this.m_createEmptyState())
  }

  clone(): User {
    return {
      id: this.id,
      isSignedIn: this.isSignedIn,
      displayName: this.displayName,
      photoURL: this.photoURL,
      email: this.email,
      emailVerified: this.emailVerified,
      isAppAdmin: this.isAppAdmin,
      myDirName: this.myDirName,
      getIsAppAdmin: this.getIsAppAdmin,
    }
  }

  async reflectCustomToken(): Promise<void> {
    const idToken = await firebase.auth().currentUser!.getIdTokenResult()
    const { isAppAdmin, myDirName } = idToken.claims as UserClaims
    this.set({ isAppAdmin, myDirName })
  }

  async getIsAppAdmin(): Promise<boolean> {
    const currentUser = firebase.auth().currentUser
    if (!currentUser) return false
    const idToken = await currentUser.getIdTokenResult()
    const { isAppAdmin } = idToken.claims as UserClaims
    return Boolean(isAppAdmin)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected initState(state: Required<void>): void {
    throw new Error(`Use 'set()' instead of 'initState()'.`)
  }

  private m_createEmptyState(): User {
    return {
      id: '',
      isSignedIn: false,
      displayName: '',
      photoURL: '',
      email: '',
      emailVerified: false,
      isAppAdmin: false,
      myDirName: '',
      getIsAppAdmin: this.getIsAppAdmin,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { UserStore, User, UserStoreImpl }
