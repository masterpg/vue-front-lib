import 'testdouble'
import { DeepPartial } from 'web-base-lib'
import _td from 'testdouble'

declare global {
  const td: typeof _td

  interface Window {
    td: typeof _td
  }
}

declare module 'testdouble' {
  export function replace<T = any, K extends keyof T = keyof T, F = DeepPartial<T[K]>>(path: {}, property: K, f?: F): T[K]
}
