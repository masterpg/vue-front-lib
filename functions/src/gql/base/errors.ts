export class GQLError extends Error {
  constructor(message: string, readonly data?: any) {
    super(message)
  }
}
