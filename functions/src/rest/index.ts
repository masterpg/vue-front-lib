import * as express from 'express'
import { authRouter, publicRouter, siteRouter } from './base'

export function initREST(app: express.Express) {
  app.use('/rest/public', publicRouter)
  app.use('/rest/site', siteRouter)
  app.use('/rest/auth', authRouter)

  require('./modules/auth/custom-token')
  require('./modules/auth/hello')
  require('./modules/public/hello')
  require('./modules/site/hello')
}
