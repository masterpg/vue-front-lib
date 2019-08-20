import * as vary from 'vary'
import { NextFunction, Request, Response } from 'express'
import { container, inject, singleton } from 'tsyringe'
import { DITypes } from '../../di.types'
import { LogEntry } from '@google-cloud/logging/build/src/entry'
import { Logger } from '../'
const merge = require('lodash/merge')

//************************************************************************
//
//  Basis
//
//************************************************************************

export function cors(options: CorsOptions) {
  return function(req: Request, res: Response, next: NextFunction) {
    const corsValidator = container.resolve<CORSValidator>(DITypes.CORSValidator)
    const o = { ...defaultOptions, ...options }
    corsValidator.execute(o, req, res, next)
  }
}

export interface CorsOptions {
  whitelist: string[]
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  optionsSuccessStatus?: number
}

const defaultOptions: CorsOptions = {
  whitelist: [],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  optionsSuccessStatus: 204,
}

export abstract class CORSValidator {
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

  execute(options: CorsOptions, req: Request, res: Response, next: NextFunction): void {
    if (!this.isAllowed(options, req)) {
      this.logNotAllowed(req, options)
    }

    const headers = []
    const method = req.method && req.method.toUpperCase && req.method.toUpperCase()

    headers.push(this.m_configureOrigin(options, req))
    headers.push(this.m_configureCredentials(options))
    headers.push(this.m_configureExposedHeaders(options))

    // プリフライトリクエスト
    if (method === 'OPTIONS') {
      headers.push(this.m_configureMethods(options))
      headers.push(this.m_configureAllowedHeaders(options, req))
      headers.push(this.m_configureMaxAge(options))
      this.m_applyHeaders(headers, res)
      // Safari (and potentially other browsers) need content-length 0,
      //   for 204 or they just hang waiting for a body
      res.statusCode = options.optionsSuccessStatus!
      res.setHeader('Content-Length', '0')
      res.end()
    }
    // 通常リクエスト
    else {
      this.m_applyHeaders(headers, res)
      if (this.isAllowed(options, req)) {
        next()
      } else {
        res.send('Not allowed by CORS.')
      }
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected logNotAllowed(req: Request, options: CorsOptions) {
    const metadata = this.logger.getBaseMetadataByRequest(req) as LogEntry
    merge(metadata, {
      severity: 500, // ERROR
    })

    const data = {
      error: {
        message: 'Not allowed by CORS.',
        requestOrigin: (req.headers.origin as string) || '',
        whitelist: options.whitelist,
      },
    }

    this.logger.log(CORSValidator.LOG_NAME, metadata, data)
  }

  protected isAllowed(options: CorsOptions, req: Request): boolean {
    const requestOrigin = (req.headers.origin as string) || ''
    const whitelist = options.whitelist || []

    // ホワイトリストが指定されていない場合
    if (whitelist.length === 0) {
      return false
    }
    // ホワイトリストが指定されている場合
    else {
      // リクエストオリジンがホワイトリストに含まれていることを検証
      return whitelist.indexOf(requestOrigin) >= 0
    }
  }

  private m_configureOrigin(options: CorsOptions, req: Request) {
    const headers: any = []
    const whitelist = options.whitelist || []
    const requestOrigin = (req.headers.origin as string) || ''

    // リクエストオリジンがホワイトリストに含まれている場合、
    // 'Access-Control-Allow-Origin'の設定を行う
    if (whitelist.length > 0 && whitelist.indexOf(requestOrigin) >= 0) {
      headers.push({ key: 'Access-Control-Allow-Origin', value: requestOrigin })
      headers.push({ key: 'Vary', value: 'Origin' })
    }

    return headers
  }

  private m_configureCredentials(options: CorsOptions) {
    if (options.credentials === true) {
      return {
        key: 'Access-Control-Allow-Credentials',
        value: 'true',
      }
    }
    return null
  }

  private m_configureMethods(options: CorsOptions) {
    let methods: string | undefined

    if (options.methods) {
      methods = options.methods.join(',')
    }

    if (methods) {
      return {
        key: 'Access-Control-Allow-Methods',
        value: methods,
      }
    }
    return null
  }

  private m_configureAllowedHeaders(options: CorsOptions, req: Request) {
    const headers = []
    let allowedHeaders: string | undefined

    if (!options.allowedHeaders) {
      // リクエストヘッダーの'access-control-request-headers'指定された値を
      // レスポンスの'Access-Control-Allow-Headers'に設定する
      allowedHeaders = req.headers['access-control-request-headers'] as string | undefined
      headers.push({
        key: 'Vary',
        value: 'Access-Control-Request-Headers',
      })
    } else {
      // オプションの'allowedHeaders'に指定された値を
      // レスポンスの'Access-Control-Allow-Headers'に設定する
      allowedHeaders = options.allowedHeaders.join(',')
    }

    if (allowedHeaders) {
      headers.push({
        key: 'Access-Control-Allow-Headers',
        value: allowedHeaders,
      })
    }

    return headers
  }

  private m_configureMaxAge(options: CorsOptions) {
    const maxAge = (typeof options.maxAge === 'number' || options.maxAge) && options.maxAge.toString()
    if (maxAge && maxAge.length) {
      return {
        key: 'Access-Control-Max-Age',
        value: maxAge,
      }
    }
    return null
  }

  private m_configureExposedHeaders(options: CorsOptions) {
    let exposedHeaders: string | undefined

    if (!options.exposedHeaders) {
      return null
    } else {
      exposedHeaders = options.exposedHeaders.join(',')
    }

    if (exposedHeaders) {
      return {
        key: 'Access-Control-Expose-Headers',
        value: exposedHeaders,
      }
    }
    return null
  }

  private m_applyHeaders(headers: any, res: Response) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]
      if (header) {
        if (Array.isArray(header)) {
          this.m_applyHeaders(header, res)
        } else if (header.key === 'Vary' && header.value) {
          vary(res, header.value)
        } else {
          res.setHeader(header.key, header.value)
        }
      }
    }
  }
}

//************************************************************************
//
//  Concrete
//
//************************************************************************

@singleton()
export class ProdCORSValidator extends CORSValidator {
  constructor(@inject(DITypes.Logger) logger?: Logger) {
    super(logger)
  }
}

@singleton()
export class DevCORSValidator extends CORSValidator {
  constructor(@inject(DITypes.Logger) logger?: Logger) {
    super(logger)
  }

  protected logNotAllowed(req: Request, options: CorsOptions) {
    super.logNotAllowed(req, options)
    console.error(
      '[ERROR]:',
      JSON.stringify(
        {
          message: 'Not allowed by CORS.',
          requestOrigin: (req.headers.origin as string) || '',
          whitelist: options.whitelist,
        },
        null,
        2
      )
    )
  }
}
