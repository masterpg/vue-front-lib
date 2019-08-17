/**
 * Stackdriverのログ内容については下記参照
 * https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry
 */

import { ArgumentValidationError, MiddlewareFn, ResolverData } from 'type-graphql'
import { LoggingLatencyTimer, logging } from '../../base'
import { Context } from '../types'
import { GQLError } from './errors'
import { LogEntry } from '@google-cloud/logging/build/src/entry'
const merge = require('lodash/merge')

//************************************************************************
//
//  Basis
//
//************************************************************************

export const LoggingMiddleware: MiddlewareFn<Context> = async (action, next) => {
  const latencyTimer = new LoggingLatencyTimer().start()
  const req = action.context.req
  const res = action.context.res

  let result: any
  try {
    result = await next()
  } catch (err) {
    logger.logError(action, latencyTimer, err)
    throw err
  }

  if (action.info.parentType.name === 'Query' || action.info.parentType.name === 'Mutation') {
    res.on('finish', function onFinish() {
      logger.logNormal(action, latencyTimer)
    })
  }

  return result
}

class Logger {
  //----------------------------------------------------------------------
  //
  //  Constants
  //
  //----------------------------------------------------------------------

  private static readonly LOG_NAME = 'gql'

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  logNormal(action: ResolverData<Context>, latencyTimer: LoggingLatencyTimer): void {
    const res = action.context.res

    const metadata = logging.getBaseMetadataByGQL(action) as LogEntry
    merge(metadata, {
      severity: 100, // DEBUG
      httpRequest: {
        status: res.statusCode,
        responseSize: parseInt(res.get('Content-Length')),
        latency: latencyTimer.stop().data,
      },
    })

    logging.log(Logger.LOG_NAME, metadata, {})
  }

  logError(action: ResolverData<Context>, latencyTimer: LoggingLatencyTimer, err: Error): void {
    const res = action.context.res

    const metadata = logging.getBaseMetadataByGQL(action) as LogEntry
    merge(metadata, {
      severity: 500, // ERROR
      httpRequest: {
        status: res.statusCode,
        latency: latencyTimer.stop().data,
      },
    })

    logging.log(Logger.LOG_NAME, metadata, this.getErrorData(action, err))
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

class ProdLogger extends Logger {}

class DevLogger extends Logger {
  logNormal(action: ResolverData<Context>, latencyTimer: LoggingLatencyTimer) {
    super.logNormal(action, latencyTimer)
    const functionName = logging.getBaseMetadataByGQL(action).resource.labels.function_name
    console.log('[DEBUG]:', JSON.stringify({ functionName, latency: `${latencyTimer.diff.seconds}s` }, null, 2))
  }

  logError(action: ResolverData<Context>, latencyTimer: LoggingLatencyTimer, err: Error): void {
    const errorData = this.getErrorData(action, err)
    console.error('[ERROR]:', JSON.stringify(errorData, null, 2))
  }
}

const logger = (() => {
  let result: Logger
  if (process.env.NODE_ENV === 'production') {
    result = new ProdLogger()
  } else {
    result = new DevLogger()
  }
  return result
})()
