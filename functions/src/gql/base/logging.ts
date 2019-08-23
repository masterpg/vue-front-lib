import { ArgumentValidationError, MiddlewareFn, ResolverData } from 'type-graphql'
import { Logger, LoggingLatencyTimer } from '../../base'
import { container, inject, singleton } from 'tsyringe'
import { Context } from '../types'
import { DITypes } from '../../di.types'
import { GQLError } from './errors'
import { LogEntry } from '@google-cloud/logging/build/src/entry'
const merge = require('lodash/merge')

//************************************************************************
//
//  Basis
//
//************************************************************************

export const LoggingMiddleware: MiddlewareFn<Context> = async (action, next) => {
  const gqlLogger = container.resolve<GQLLogger>(DITypes.GQLLogger)
  const latencyTimer = new LoggingLatencyTimer().start()
  const res = action.context.res

  let result: any
  try {
    result = await next()
  } catch (err) {
    gqlLogger.logError(err, action, latencyTimer)
    throw err
  }

  if (action.info.parentType.name === 'Query' || action.info.parentType.name === 'Mutation') {
    res.on('finish', function onFinish() {
      gqlLogger.logNormal(action, latencyTimer)
    })
  }

  return result
}

export class GQLLogger {
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

  logNormal(action: ResolverData<Context>, latencyTimer: LoggingLatencyTimer): void {
    const req = action.context.req
    const res = action.context.res
    const info = action.info

    const metadata = this.logger.getBaseMetadata(req, info) as LogEntry
    merge(metadata, {
      severity: 100, // DEBUG
      httpRequest: {
        status: res.statusCode,
        responseSize: parseInt(res.get('Content-Length')),
        latency: latencyTimer.stop().data,
      },
    })

    const data = this.logger.getBaseData(req)

    this.logger.log(GQLLogger.LOG_NAME, metadata, data)
  }

  logError(err: Error, action: ResolverData<Context>, latencyTimer: LoggingLatencyTimer): void {
    const req = action.context.req
    const res = action.context.res
    const info = action.info

    const metadata = this.logger.getBaseMetadata(req, info) as LogEntry
    merge(metadata, {
      severity: 500, // ERROR
      httpRequest: {
        status: res.statusCode,
        latency: latencyTimer.stop().data,
      },
    })

    this.logger.log(GQLLogger.LOG_NAME, metadata, this.getErrorData(action, err))
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected getErrorData(
    action: ResolverData<Context>,
    err: Error
  ): {
    gql: any
    error: {
      message: string
      data?: any
    }
    uid?: string
  } {
    const req = action.context.req

    const data = {
      ...this.logger.getBaseData(req),
      gql: req.body,
      error: {
        message: err.message,
      },
    }

    if (action.context.user) {
      merge(data, {
        uid: action.context.user.uid,
      })
    }

    if (err instanceof GQLError && err.data) {
      merge(data.error, {
        data: err.data,
      })
    } else if (err instanceof ArgumentValidationError) {
      merge(data.error, {
        data: err.validationErrors,
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
export class ProdGQLLogger extends GQLLogger {
  constructor(@inject(DITypes.Logger) logger?: Logger) {
    super(logger)
  }
}

@singleton()
export class DevGQLLogger extends GQLLogger {
  constructor(@inject(DITypes.Logger) logger?: Logger) {
    super(logger)
  }

  logNormal(action: ResolverData<Context>, latencyTimer: LoggingLatencyTimer) {
    const req = action.context.req
    const info = action.info
    super.logNormal(action, latencyTimer)
    const functionName = this.logger.getBaseMetadata(req, info).resource.labels.function_name
    const detail = {
      functionName,
      latency: `${latencyTimer.diff.seconds}s`,
    }
    console.log('[DEBUG]:', JSON.stringify(detail, null, 2))
  }

  logError(err: Error, action: ResolverData<Context>, latencyTimer: LoggingLatencyTimer): void {
    const errorData = this.getErrorData(action, err)
    console.error('[ERROR]:', JSON.stringify(errorData, null, 2))
  }
}
