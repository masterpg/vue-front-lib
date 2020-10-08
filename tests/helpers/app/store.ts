import { BaseLogic } from '@/app/logic/base'
import { BaseStore } from '@/app/logic/store/base'
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

type TestLogic<L extends BaseLogic> = { [P in keyof L]: L[P] } & {
  db: BaseLogic['db']
  authStatus: BaseLogic['authStatus']
  setAuthStatus: BaseLogic['setAuthStatus']
  isSignedIn: BaseLogic['isSignedIn']
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
