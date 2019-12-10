import { BaseStoreContainer, setStore } from '@/lib'
import { Component } from 'vue-property-decorator'

//========================================================================
//
//  Internal
//
//========================================================================

@Component
class MockStoreContainer extends BaseStoreContainer {}

//========================================================================
//
//  Exports
//
//========================================================================

export let store: MockStoreContainer

export function initLibStore(): void {
  store = new MockStoreContainer()
  setStore(store)
}
