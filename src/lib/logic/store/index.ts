import { UserModule } from './types'
import { UserModuleImpl } from './modules/user'
import Vue from 'vue'

//========================================================================
//
//  Exports
//
//========================================================================

export abstract class BaseStoreContainer extends Vue {
  readonly user: UserModule = new UserModuleImpl()
}

export let store: BaseStoreContainer

export function setStore(value: BaseStoreContainer): void {
  store = value
}

export { StatePartial, StoreError, User, UserModule, UserState } from './types'

export { BaseModule } from './base'
