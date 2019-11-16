import { User, UserModule, UserState } from '../../types'
import { BaseModule } from '../../base'
import { Component } from 'vue-property-decorator'
import { NoCache } from '../../../../base/decorators'

@Component
export class UserModuleImpl extends BaseModule<UserState> implements UserModule {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
    this.initState(this.m_createEmptyState())
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @NoCache
  get value(): User {
    return this.clone(this.state)
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  clonePartial(value: Partial<User>): Partial<User> {
    return {
      id: value.id,
      isSignedIn: value.isSignedIn,
      displayName: value.displayName,
      photoURL: value.photoURL,
      email: value.email,
      emailVerified: value.emailVerified,
    }
  }

  clone(value: User): User {
    return this.clonePartial(value) as Required<User>
  }

  set(value: Partial<User>): User {
    Object.assign(this.state, this.clonePartial(value))
    return this.value
  }

  clear(): void {
    this.set(this.m_createEmptyState())
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
    }
  }
}
