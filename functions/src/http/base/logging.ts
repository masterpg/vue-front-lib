/**
 * Stackdriverのログ内容については下記参照
 * https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry
 */

import { BadRequestError, ExpressErrorMiddlewareInterface, ExpressMiddlewareInterface, Middleware } from 'routing-controllers'
import { IdToken, Logger, LoggingLatencyData, LoggingLatencyTimer } from '../../base'
import { NextFunction, Request, Response } from 'express'
import { container, inject, singleton } from 'tsyringe'
import { DITypes } from '../../di.types'
import { LogEntry } from '@google-cloud/logging/build/src/entry'
const merge = require('lodash/merge')

@Middleware({ type: 'before' })
export class LoggingBeforeMiddleware implements ExpressMiddlewareInterface {
  use(req: Request, res: Response, next: NextFunction): void {
    ;(req as any).__latencyTimer = new LoggingLatencyTimer().start()
    next()
  }
}

@Middleware({ type: 'after' })
export class LoggingAfterMiddleware implements ExpressMiddlewareInterface {
  use(req: Request, res: Response, next: NextFunction): void {
    const logger = container.resolve<HTTPLogger>(DITypes.HTTPLogger)
    const latencyTimer = (req as any).__latencyTimer as LoggingLatencyTimer
    logger.logNormal(req, res, latencyTimer)
    next()
  }
}

@Middleware({ type: 'after' })
export class LoggingErrorMiddleware implements ExpressErrorMiddlewareInterface {
  error(error: any, req: Request, res: Response, next: NextFunction) {
    const logger = container.resolve<HTTPLogger>(DITypes.HTTPLogger)
    const latencyTimer = (req as any).__latencyTimer as LoggingLatencyTimer
    logger.logError(error, req, res, latencyTimer)
    next()
  }
}

//************************************************************************
//
//  Basis
//
//************************************************************************

export class HTTPLogger {
  //----------------------------------------------------------------------
  //
  //  Constructor
  //
  //----------------------------------------------------------------------

  constructor(logger?: Logger) {
    this.logger = logger!
  }

  //----------------------------------------------------------------------
  //
  //  Constants
  //
  //----------------------------------------------------------------------

  private static readonly LOG_NAME = 'api'

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  protected logger: Logger

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  logNormal(req: Request, res: Response, latencyTimer?: LoggingLatencyTimer): void {
    let latency: LoggingLatencyData = { seconds: 0, nanos: 0 }
    if (latencyTimer) latency = latencyTimer.stop().data

    const metadata = this.logger.getBaseMetadata(req) as LogEntry
    merge(metadata, {
      severity: 100, // DEBUG
      httpRequest: {
        status: res.statusCode,
        responseSize: parseInt(res.get('Content-Length')),
        latency,
      },
    })

    const data = this.logger.getBaseData(req)

    this.logger.log(HTTPLogger.LOG_NAME, metadata, data)
  }

  logError(err: Error, req: Request, res: Response, latencyTimer?: LoggingLatencyTimer): void {
    let latency: LoggingLatencyData = { seconds: 0, nanos: 0 }
    if (latencyTimer) latency = latencyTimer.stop().data

    const metadata = this.logger.getBaseMetadata(req) as LogEntry
    merge(metadata, {
      severity: 500, // ERROR
      httpRequest: {
        status: res.statusCode,
        latency,
      },
    })

    this.logger.log(HTTPLogger.LOG_NAME, metadata, this.getErrorData(req, err))
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected getErrorData(
    req: Request,
    err: Error
  ): {
    error: {
      message: string
      data?: any
    }
    uid?: string
  } {
    const data = {
      ...this.logger.getBaseData(req),
      error: {
        message: err.message,
      },
    }

    const authErrorMessage = (req as any).__authErrorMessage as string | undefined
    if (authErrorMessage) {
      data.error.message = authErrorMessage
    } else if (err instanceof BadRequestError) {
      merge(data.error, {
        data: (err as any).errors,
      })
    }

    const user = (req as any).__idToken as IdToken | undefined
    if (user) {
      merge(data, {
        uid: user.uid,
      })
    }

    return data
  }
}

//************************************************************************
//
//  Concrete
//
//************************************************************************

@singleton()
export class ProdHTTPLogger extends HTTPLogger {
  constructor(@inject(DITypes.Logger) logger?: Logger) {
    super(logger)
  }
}

@singleton()
export class DevHTTPLogger extends HTTPLogger {
  constructor(@inject(DITypes.Logger) logger?: Logger) {
    super(logger)
  }

  logNormal(req: Request, res: Response, latencyTimer?: LoggingLatencyTimer) {
    let latency = 0
    if (latencyTimer) latency = latencyTimer.stop().diff.seconds

    super.logNormal(req, res, latencyTimer)
    const functionName = this.logger.getBaseMetadata(req).resource.labels.function_name
    const detail = {
      functionName,
      latency: `${latency}s`,
    }
    console.log('[DEBUG]:', JSON.stringify(detail, null, 2))
  }

  logError(err: Error, req: Request, res: Response, latencyTimer: LoggingLatencyTimer): void {
    const errorData = this.getErrorData(req, err)
    const detail = merge(errorData, {
      error: {
        status: res.statusCode,
      },
    })
    console.error('[ERROR]:', JSON.stringify(detail, null, 2))
  }
}
