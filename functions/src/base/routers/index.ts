import * as express from 'express'
import * as functions from 'firebase-functions'
import * as middlewares from '../middlewares'
const cors = require('cors')
const cookieParser = require('cookie-parser')()

export class Routers {
  constructor() {
    let whitelist: string[] = []
    if (process.env.NODE_ENV === 'production') {
      whitelist = functions.config().cors.whitelist.split(',')
    }
    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) {
          callback(new Error('Not allowed empty origin by CORS.'))
        } else {
          if (whitelist.length === 0 || whitelist.indexOf(origin) !== -1) {
            callback(null, true)
          } else {
            callback(new Error('Not allowed by CORS.'))
          }
        }
      },
    }

    this.public.use(cors())
    this.site.use(cors(corsOptions))
    this.auth.use(cors(corsOptions))
    this.auth.use(cookieParser)
    this.auth.use(middlewares.auth)
  }

  private m_public = express.Router()

  get public(): express.Router {
    return this.m_public
  }

  private m_site = express.Router()

  get site(): express.Router {
    return this.m_site
  }

  private m_auth = express.Router()

  get auth(): express.Router {
    return this.m_auth
  }
}
