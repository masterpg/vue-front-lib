import { Account, AccountModule } from '@/store/types'
import { BaseModule } from '@/store/base'
import { Component } from 'vue-property-decorator'
const assign = require('lodash/assign')

@Component
export class AccountModuleImpl extends BaseModule<Account> implements AccountModule {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super()
    this.initState({
      isSignedIn: false,
      displayName: '',
      photoURL: '',
      emailVerified: false,
    })
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  get value(): Account {
    return this.state
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  set(account: Partial<Account>): Account {
    assign(this.state, account)
    return this.state
  }
}
