import 'markdown-it'

declare module 'markdown-it/lib' {
  interface Rule<S extends State = State> {
    (state: S, startLine: number, endLine: number, silent?: boolean): boolean | void
  }
}
