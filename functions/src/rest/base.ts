import { config, middlewares } from '../base'
import { Router } from 'express'
const cookieParser = require('cookie-parser')()

export const publicRouter = Router()

export const siteRouter = Router().use(middlewares.cors({ whitelist: config.cors.whitelist }))

export const authRouter = Router().use(middlewares.cors({ whitelist: config.cors.whitelist }), cookieParser, middlewares.auth)
