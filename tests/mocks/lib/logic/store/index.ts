import { LibStoreContainerImpl, setStore } from '@/lib'
import { Component } from 'vue-property-decorator'

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class MockStoreContainer extends LibStoreContainerImpl {}

let store: MockStoreContainer

function initLibTestStore(): void {
  store = new MockStoreContainer()
  setStore(store)
}

//========================================================================
//
//  Exports
//
//========================================================================

export { store, initLibTestStore }
