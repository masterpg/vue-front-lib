import 'testdouble'
import { DeepPartial } from 'web-base-lib'
import td from 'testdouble'

declare global {
  const td: typeof td

  interface Window {
    td: typeof td
  }
}

declare module 'testdouble' {
  export function replace<T = any, K extends keyof T = keyof T, F = DeepPartial<T[K]>>(path: {}, property: K, f?: F): T[K]
}
