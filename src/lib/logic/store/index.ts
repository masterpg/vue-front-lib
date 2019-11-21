import { UserModule } from './types'
import { UserModuleImpl } from './modules/user'
import Vue from 'vue'

//========================================================================
//
//  Exports
//
//========================================================================

export interface LibStoreContainer {
  readonly user: UserModule
}

export abstract class BaseLibStoreContainer extends Vue implements LibStoreContainer {
  readonly user: UserModule = new UserModuleImpl()
}

export let store: LibStoreContainer

export function setStore(value: LibStoreContainer): void {
  store = value
}

export { StatePartial, StoreError, User, UserModule, UserState } from './types'

export { BaseModule } from './base'
