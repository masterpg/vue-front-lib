import { BaseLibStoreContainer, setStore } from '@/lib'
import { Component } from 'vue-property-decorator'

//========================================================================
//
//  Internal
//
//========================================================================

@Component
class MockStoreContainer extends BaseLibStoreContainer {}

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
