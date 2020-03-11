import 'testdouble'

declare module 'testdouble' {
  export function replace<T = any>(path: {}, property: keyof T, f?: any): any
}
