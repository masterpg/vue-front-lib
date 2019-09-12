import * as express from 'express'
import { CartController, ProductController, StorageController } from './modules'
import { LoggingAfterMiddleware, LoggingBeforeMiddleware, LoggingErrorMiddleware } from './base'
import { authorizationChecker, currentUserChecker } from './base'
import { useExpressServer } from 'routing-controllers'

export function initHTTP(app: express.Express) {
  useExpressServer(app, {
    controllers: [CartController, ProductController, StorageController],
    middlewares: [LoggingBeforeMiddleware, LoggingAfterMiddleware, LoggingErrorMiddleware],
    authorizationChecker,
    currentUserChecker,
  })
}
