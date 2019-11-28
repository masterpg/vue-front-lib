import { User, UserModule } from '../../types'
import { BaseModule } from '../../base'
import { Component } from 'vue-property-decorator'
const isBoolean = require('lodash/isBoolean')
const isString = require('lodash/isString')

@Component
export class UserModuleImpl extends BaseModule<void> implements UserModule {
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

  private m_storageDir = ''

  get storageDir(): string {
    return this.m_storageDir
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
    if (isString(value.storageDir)) this.m_storageDir = value.storageDir!
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
      storageDir: this.storageDir,
      getIsAppAdmin: this.getIsAppAdmin,
    }
  }

  async reflectCustomToken(): Promise<void> {
    const idToken = await firebase.auth().currentUser!.getIdTokenResult()
    const { isAppAdmin, storageDir } = idToken.claims as Partial<User>
    this.set({ isAppAdmin, storageDir })
  }

  async getIsAppAdmin(): Promise<boolean> {
    const currentUser = firebase.auth().currentUser
    if (!currentUser) return false
    const idToken = await currentUser.getIdTokenResult()
    const { isAppAdmin } = idToken.claims as Partial<User>
    return Boolean(isAppAdmin)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_createEmptyState(): User {
    return {
      id: '',
      isSignedIn: false,
      displayName: '',
      photoURL: '',
      email: '',
      emailVerified: false,
      isAppAdmin: false,
      storageDir: '',
      getIsAppAdmin: this.getIsAppAdmin,
    }
  }
}
