import * as firebase from 'firebase/app'
import { BaseStore } from '@/lib'
import { Constructor } from 'web-base-lib'

//========================================================================
//
//  Implementation
//
//========================================================================

type TestStore<Store, State> = Omit<Store, 'state' | 'initState'> & {
  state: BaseStore<State>['state']
  initState: BaseStore<State>['initState']
}

type TestLogic<L> = { [P in keyof L]: L[P] } & {
  db: firebase.firestore.Firestore
}

function newTestStore<Store, State>(storeModuleClass: Constructor<Store>): TestStore<Store, State> {
  return (new storeModuleClass() as any) as TestStore<Store, State>
}

//========================================================================
//
//  Exports
//
//========================================================================

export { TestStore, TestLogic, newTestStore }
