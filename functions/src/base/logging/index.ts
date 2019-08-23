import * as convertHrtime from 'convert-hrtime'
import * as path from 'path'
import { Log, Logging } from '@google-cloud/logging'
import { GraphQLResolveInfo } from 'graphql'
import { LogEntry } from '@google-cloud/logging/build/src/entry'
import { Request } from 'express'
import { config } from '../'
import { singleton } from 'tsyringe'

//************************************************************************
//
//  Basis
//
//************************************************************************

export interface LoggingLatencyData {
  seconds: number
  nanos: number
}

export class LoggingLatencyTimer {
  private m_startTime: [number, number] = [0, 0]

  private m_diff: convertHrtime.HRTime = { seconds: 0, milliseconds: 0, nanoseconds: 0 }

  get diff() {
    return this.m_diff
  }

  private m_data: LoggingLatencyData = { seconds: 0, nanos: 0 }

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

export abstract class Logger {
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

  getBaseMetadata(req: Request, info?: GraphQLResolveInfo): LoggingBaseMetadata {
    const metadata = this.m_getBaseMetadata(req)
    if (info) {
      metadata.resource.labels.function_name = this.m_getFunctionNameByGQL(info)
    }
    return metadata
  }

  getBaseData(req: Request): { requestOrigin: string } {
    return {
      requestOrigin: (req.headers.origin as string) || '',
    }
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
          function_name: this.getFunctionNameByRequest(req),
          region: config.functions.region,
        },
      },
      httpRequest: {
        ...this.m_getRequestData(req),
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

  private m_getFunctionNameByGQL(info: GraphQLResolveInfo): string {
    return `api/gql/${info.path.key}`
  }
}

//************************************************************************
//
//  Concrete
//
//************************************************************************

@singleton()
export class ProdLogger extends Logger {
  getFunctionNameByRequest(req: Request): string {
    // 例: function_name = "api/rest/hello"
    // ・req.baseUrl: "/rest"
    // ・req.path: "/hello"
    return path.join('api', req.baseUrl, req.path).replace(/\/$/, '')
  }

  protected getRequestUrl(req: Request): string {
    return `${this.getProtocol(req)}://${req.headers.host}${path.join('/api', req.originalUrl)}`
  }
}

@singleton()
export class DevLogger extends Logger {
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
