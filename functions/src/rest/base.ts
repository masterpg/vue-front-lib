import * as express from 'express'
import * as middlewares from '../base/middlewares'
const cookieParser = require('cookie-parser')()

export const publicRouter = express.Router().use(middlewares.cors(false))

export const siteRouter = express.Router().use(middlewares.cors(true))

export const authRouter = express.Router().use(middlewares.cors(true), cookieParser, middlewares.auth)
