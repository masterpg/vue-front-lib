import * as express from 'express'

export interface GQLContext {
  readonly req: express.Request
  readonly res: express.Response
}
