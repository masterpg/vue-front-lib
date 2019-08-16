import * as convertHrtime from 'convert-hrtime'
import * as path from 'path'
import { Log, Logging } from '@google-cloud/logging'
import { Context } from '../../gql/types'
import { LogEntry } from '@google-cloud/logging/build/src/entry'
import { Request } from 'express'
import { ResolverData } from 'type-graphql'
import { config } from '../'

//************************************************************************
//
//  Basis
//
//************************************************************************

export interface LoggingBaseMetadata {
  resource: LoggingResourceData
  httpRequest: LoggingRequestData
}

export interface LoggingResourceData {
  type: string
  labels: {
    function_name: string
    region: string
  }
}

export interface LoggingRequestData {
  referer: string | undefined
  protocol: string
  remoteIp: string
  requestUrl: string
  requestMethod: string
  userAgent: string | undefined
  requestSize: number
}

abstract class LoggingUtils {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_logMap: { [logName: string]: Log } = {}

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  log(logName: string, metadata?: LogEntry, data?: string | {}) {
    let targetLog = this.m_logMap[logName]
    if (!targetLog) {
      targetLog = new Logging().log(logName)
      this.m_logMap[logName] = targetLog
    }
    const entry = targetLog.entry(metadata, data)
    return targetLog.write(entry)
  }

  getBaseMetadataByRequest(req: Request): LoggingBaseMetadata {
    const metadata = this.m_getBaseMetadata(req)
    metadata.resource.labels.function_name = this.getFunctionNameByRequest(req)
    return metadata
  }

  getBaseMetadataByGQL(action: ResolverData<Context>): LoggingBaseMetadata {
    const metadata = this.m_getBaseMetadata(action.context.req)
    metadata.resource.labels.function_name = this.m_getFunctionNameByGQL(action)
    return metadata
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected abstract getFunctionNameByRequest(req: Request): string

  protected abstract getRequestUrl(req: Request): string

  protected getProtocol(req: Request): string {
    return req.get('X-Forwarded-Proto') || req.protocol
  }

  private m_getBaseMetadata(req: Request): LoggingBaseMetadata {
    return {
      resource: {
        type: 'cloud_function',
        labels: {
          function_name: '',
          region: config.functions.region,
        },
      },
      httpRequest: {
        ...logging.m_getRequestData(req),
      },
    }
  }

  private m_getRequestData(req: Request): LoggingRequestData {
    return {
      protocol: this.getProtocol(req),
      requestMethod: req.method,
      requestUrl: this.getRequestUrl(req),
      requestSize: parseInt(req.headers['content-length'] || ''),
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
      remoteIp: req.ip || '',
    }
  }

  private m_getFunctionNameByGQL(action: ResolverData<Context>): string {
    return `api/gql/${action.info.path.key}`
  }
}

//************************************************************************
//
//  Concrete
//
//************************************************************************

class ProdLoggingUtils extends LoggingUtils {
  getFunctionNameByRequest(req: Request): string {
    // 例: function_name = "api/rest/hello"
    // ・req.baseUrl: "/rest"
    // ・req.path: "/hello"
    return path.join('api', req.baseUrl, req.path)
  }

  protected getRequestUrl(req: Request): string {
    return `${this.getProtocol(req)}://${req.headers.host}${path.join('/api', req.originalUrl)}`
  }
}

class DevLoggingUtils extends LoggingUtils {
  getFunctionNameByRequest(req: Request): string {
    // 例: function_name = "api/rest/hello"
    // ・req.baseUrl: " /vue-base-project-7295/asia-northeast1/api/rest"
    // ・req.path: "/hello"
    const matched = `${req.baseUrl}${req.path}`.match(/\/api\/.*[^/]/)
    if (matched) {
      return matched[0]
    }
    return ''
  }

  protected getRequestUrl(req: Request): string {
    return `${this.getProtocol(req)}://${req.headers.host}${req.originalUrl}`
  }
}

//************************************************************************
//
//  Export
//
//************************************************************************

export const logging = (() => {
  let result: LoggingUtils
  if (process.env.NODE_ENV === 'production') {
    result = new ProdLoggingUtils()
  } else {
    result = new DevLoggingUtils()
  }
  return result
})()

export class LoggingLatencyTimer {
  private m_startTime: [number, number] = [0, 0]

  private m_diff: convertHrtime.HRTime = { seconds: 0, milliseconds: 0, nanoseconds: 0 }

  get diff() {
    return this.m_diff
  }

  private m_data: { seconds: number; nanos: number } = { seconds: 0, nanos: 0 }

  get data() {
    return this.m_data
  }

  start(): LoggingLatencyTimer {
    this.m_startTime = process.hrtime()
    this.m_diff = { seconds: 0, milliseconds: 0, nanoseconds: 0 }
    this.m_data = { seconds: 0, nanos: 0 }
    return this
  }

  stop(): LoggingLatencyTimer {
    this.m_diff = convertHrtime(process.hrtime(this.m_startTime))
    this.m_data = {
      seconds: Math.floor(this.diff.seconds),
      nanos: this.diff.nanoseconds - Math.floor(this.diff.seconds) * 1e9,
    }
    return this
  }
}
