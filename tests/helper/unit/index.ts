type Constructor<T = any> = new (...args: any[]) => T

export type TestStoreModule<S, M> = { [P in keyof M]: M[P] } & {
  state: S
  initState(state: S): void
}

export function newTestStoreModule<S, M>(storeModuleClass: Constructor<M>): TestStoreModule<S, M> {
  return new storeModuleClass() as TestStoreModule<S, M>
}
