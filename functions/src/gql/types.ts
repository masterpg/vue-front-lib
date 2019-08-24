import * as express from 'express'
import { IdToken } from '../base'

export interface Context {
  readonly req: express.Request

  readonly res: express.Response

  readonly user?: IdToken

  setUser(user: IdToken): void
}

export * from './modules/cart/types'
export * from './modules/product/types'
export * from './modules/recipe/types'
