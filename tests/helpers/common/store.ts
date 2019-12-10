import * as firebase from 'firebase/app'
import { Constructor } from 'web-base-lib'

export type TestStore<S, M> = { [P in keyof M]: M[P] } & {
  state: S
  initState(state: S): void
}

export type TestLogic<L> = { [P in keyof L]: L[P] } & {
  db: firebase.firestore.Firestore
}

export function newTestStore<S, M>(storeModuleClass: Constructor<M>): TestStore<S, M> {
  return new storeModuleClass() as TestStore<S, M>
}
