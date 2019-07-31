import { authRouter, publicRouter, siteRouter } from './base'
import { Express } from 'express'

export function initAPI(app: Express) {
  app.use('/public', publicRouter)
  app.use('/site', siteRouter)
  app.use('/auth', authRouter)

  require('./modules/auth/custom-token')
  require('./modules/auth/hello')
  require('./modules/public/hello')
  require('./modules/site/hello')
}
