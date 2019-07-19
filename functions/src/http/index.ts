import * as express from 'express'
import * as functions from 'firebase-functions'
import { routers } from '../base'

const init = () => {
  const app = express()
  app.use('/public', routers.public)
  app.use('/site', routers.site)
  app.use('/auth', routers.auth)
  const api = functions.region('asia-northeast1').https.onRequest(app)

  require('./controllers/auth/custom-token')
  require('./controllers/auth/hello')
  require('./controllers/public/hello')
  require('./controllers/site/hello')

  return { api }
}

export { init }
