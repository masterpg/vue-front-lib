import { PublicProfile, UserClaims, UserInfo } from '@/example/logic/types'
import dayjs, { Dayjs } from 'dayjs'
import { BaseStore } from '@/example/logic/store/base'
import { Component } from 'vue-property-decorator'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface UserStore extends UserInfo {
  set(user: EditedUser): void

  clear(): void

  clone(): UserInfo

  reflectCustomToken(): Promise<void>
}

interface ReadonlyUser extends Readonly<Omit<UserInfo, 'publicProfile'>> {
  publicProfile: Readonly<PublicProfile>
}

interface EditedUser extends Partial<Omit<UserInfo, 'publicProfile'>> {
  publicProfile?: Partial<PublicProfile>
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

  private m_user: UserInfo = this.m_createEmptyState()

  get id(): string {
    return this.m_user.id
  }

  get email(): string {
    return this.m_user.email
  }

  get emailVerified(): boolean {
    return this.m_user.emailVerified
  }

  get isAppAdmin(): boolean {
    return this.m_user.isAppAdmin
  }

  get createdAt(): Dayjs {
    return this.m_user.createdAt
  }

  get updatedAt(): Dayjs {
    return this.m_user.updatedAt
  }

  get publicProfile(): Readonly<PublicProfile> {
    return this.m_user.publicProfile
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  set(value: EditedUser): void {
    if (typeof value.id === 'string') this.m_user.id = value.id
    if (typeof value.email === 'string') this.m_user.email = value.email
    if (typeof value.emailVerified === 'boolean') this.m_user.emailVerified = value.emailVerified
    if (typeof value.isAppAdmin === 'boolean') this.m_user.isAppAdmin = value.isAppAdmin
    if (value.createdAt) this.m_user.createdAt = value.createdAt
    if (value.updatedAt) this.m_user.updatedAt = value.updatedAt
    if (value.publicProfile) {
      if (typeof value.publicProfile.id === 'string') this.m_user.publicProfile.id = value.publicProfile.id
      if (typeof value.publicProfile.displayName === 'string') this.m_user.publicProfile.displayName = value.publicProfile.displayName
      if (typeof value.publicProfile.photoURL === 'string') this.m_user.publicProfile.photoURL = value.publicProfile.photoURL
      if (value.publicProfile.createdAt) this.m_user.publicProfile.createdAt = value.createdAt as Dayjs
      if (value.publicProfile.updatedAt) this.m_user.publicProfile.updatedAt = value.updatedAt as Dayjs
    }
  }

  clear(): void {
    this.set(this.m_createEmptyState())
  }

  clone(): UserInfo {
    return {
      id: this.m_user.id,
      email: this.email,
      emailVerified: this.emailVerified,
      isAppAdmin: this.isAppAdmin,
      createdAt: this.m_user.createdAt,
      updatedAt: this.m_user.updatedAt,
      publicProfile: {
        id: this.m_user.publicProfile.id,
        displayName: this.m_user.publicProfile.displayName,
        photoURL: this.m_user.publicProfile.photoURL,
        createdAt: this.m_user.publicProfile.createdAt,
        updatedAt: this.m_user.publicProfile.updatedAt,
      },
    }
  }

  async reflectCustomToken(): Promise<void> {
    const idToken = await firebase.auth().currentUser!.getIdTokenResult()
    const { isAppAdmin } = idToken.claims as UserClaims
    this.set({ isAppAdmin })
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected initState(state: Required<void>): void {
    throw new Error(`Use 'set()' instead of 'initState()'.`)
  }

  private m_createEmptyState(): UserInfo {
    return {
      id: '',
      email: '',
      emailVerified: false,
      isAppAdmin: false,
      createdAt: dayjs(0),
      updatedAt: dayjs(0),
      publicProfile: {
        id: '',
        displayName: '',
        photoURL: '',
        createdAt: dayjs(0),
        updatedAt: dayjs(0),
      },
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { EditedUser, UserStore, UserStoreImpl }
