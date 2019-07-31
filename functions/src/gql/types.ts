import * as express from 'express'

export interface Context {
  readonly req: express.Request

  readonly res: express.Response
}
