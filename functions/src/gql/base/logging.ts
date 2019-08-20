/**
 * Stackdriverのログ内容については下記参照
 * https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry
 */

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
    gqlLogger.logError(action, latencyTimer, err)
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

  private static readonly LOG_NAME = 'gql'

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
    const res = action.context.res

    const metadata = this.logger.getBaseMetadataByGQL(action) as LogEntry
    merge(metadata, {
      severity: 100, // DEBUG
      httpRequest: {
        status: res.statusCode,
        responseSize: parseInt(res.get('Content-Length')),
        latency: latencyTimer.stop().data,
      },
    })

    this.logger.log(GQLLogger.LOG_NAME, metadata, {})
  }

  logError(action: ResolverData<Context>, latencyTimer: LoggingLatencyTimer, err: Error): void {
    const res = action.context.res

    const metadata = this.logger.getBaseMetadataByGQL(action) as LogEntry
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
    super.logNormal(action, latencyTimer)
    const functionName = this.logger.getBaseMetadataByGQL(action).resource.labels.function_name
    console.log('[DEBUG]:', JSON.stringify({ functionName, latency: `${latencyTimer.diff.seconds}s` }, null, 2))
  }

  logError(action: ResolverData<Context>, latencyTimer: LoggingLatencyTimer, err: Error): void {
    const errorData = this.getErrorData(action, err)
    console.error('[ERROR]:', JSON.stringify(errorData, null, 2))
  }
}
