import * as middlewares from '../middlewares'
import { Router } from 'express'
const cookieParser = require('cookie-parser')()

export const publicRouter = Router().use(middlewares.cors(false))

export const siteRouter = Router().use(middlewares.cors(true))

export const authRouter = Router().use(middlewares.cors(true), cookieParser, middlewares.auth)
