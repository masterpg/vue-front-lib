import 'testdouble'
import { DeepPartial } from 'web-base-lib'
import td from 'testdouble'
import * as firebase from '@firebase/testing'

declare global {
  const td: typeof td

  interface Window {
    td: typeof td
    firebase: typeof firebase
  }
}

declare module 'testdouble' {
  export function replace<T = any, K extends keyof T = keyof T, F = DeepPartial<T[K]>>(path: {}, property: K, f?: F): T[K]
}
