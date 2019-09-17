import * as vary from 'vary'
import { NextFunction, Request, Response } from 'express'
import { container, inject, singleton } from 'tsyringe'
import { DITypes } from '../../di.types'
import { LogEntry } from '@google-cloud/logging/build/src/entry'
import { Logger } from '../logging'
import { config } from '../config'
const merge = require('lodash/merge')

//************************************************************************
//
//  Basis
//
//************************************************************************

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const corsValidator = container.resolve<CORSValidator>(DITypes.CORSValidator)
  corsValidator.execute(req, res, next)
}

interface CORSOptions {
  whitelist?: string[]
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  optionsSuccessStatus?: number
  allowedBlankOrigin?: boolean
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

  protected get defaultOptions(): CORSOptions {
    return {
      whitelist: config.cors.whitelist,
      methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
      credentials: false,
      optionsSuccessStatus: 204,
      allowedBlankOrigin: false,
    }
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  execute(req: Request, res: Response, next: NextFunction, options?: CORSOptions): void {
    options = {
      ...this.defaultOptions,
      ...(options || {}),
    }

    if (!this.isAllowed(options, req)) {
      this.logNotAllowed(req, options)
    }

    const headers = []
    const method = req.method && req.method.toUpperCase && req.method.toUpperCase()

    headers.push(this.configureOrigin(options, req))
    headers.push(this.configureCredentials(options))
    headers.push(this.configureExposedHeaders(options))

    // プリフライトリクエスト
    if (method === 'OPTIONS') {
      headers.push(this.configureMethods(options))
      headers.push(this.configureAllowedHeaders(options, req))
      headers.push(this.configureMaxAge(options))
      this.applyHeaders(headers, res)
      // Safari (and potentially other browsers) need content-length 0,
      //   for 204 or they just hang waiting for a body
      res.statusCode = options.optionsSuccessStatus!
      res.setHeader('Content-Length', '0')
      res.end()
    }
    // 通常リクエスト
    else {
      this.applyHeaders(headers, res)
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

  protected isAllowed(options: CORSOptions, req: Request): boolean {
    const requestOrigin = (req.headers.origin as string) || ''
    const whitelist = options.whitelist || []

    // リクエストオリジンの空を許容していて、かつリクエストオリジンが空の場合
    if (options.allowedBlankOrigin && !requestOrigin) {
      return true
    }
    // ホワイトリストが指定されていない場合
    else if (whitelist.length === 0) {
      return false
    }
    // ホワイトリストが指定されている場合
    else {
      // リクエストオリジンがホワイトリストに含まれていることを検証
      return whitelist.indexOf(requestOrigin) >= 0
    }
  }

  protected configureOrigin(options: CORSOptions, req: Request) {
    const headers: any = []
    const whitelist = options.whitelist || []
    const requestOrigin = (req.headers.origin as string) || ''

    // リクエストオリジンの空を許容していて、かつリクエストオリジンが空の場合
    if (options.allowedBlankOrigin && !requestOrigin) {
      headers.push({ key: 'Access-Control-Allow-Origin', value: '*' })
      headers.push({ key: 'Vary', value: 'Origin' })
    }
    // リクエストオリジンがホワイトリストに含まれている場合
    else if (whitelist.length > 0 && whitelist.indexOf(requestOrigin) >= 0) {
      headers.push({ key: 'Access-Control-Allow-Origin', value: requestOrigin })
      headers.push({ key: 'Vary', value: 'Origin' })
    }

    return headers
  }

  protected configureCredentials(options: CORSOptions) {
    if (options.credentials === true) {
      return {
        key: 'Access-Control-Allow-Credentials',
        value: 'true',
      }
    }
    return null
  }

  protected configureMethods(options: CORSOptions) {
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

  protected configureAllowedHeaders(options: CORSOptions, req: Request) {
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

  protected configureMaxAge(options: CORSOptions) {
    const maxAge = (typeof options.maxAge === 'number' || options.maxAge) && options.maxAge.toString()
    if (maxAge && maxAge.length) {
      return {
        key: 'Access-Control-Max-Age',
        value: maxAge,
      }
    }
    return null
  }

  protected configureExposedHeaders(options: CORSOptions) {
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

  protected applyHeaders(headers: any, res: Response) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]
      if (header) {
        if (Array.isArray(header)) {
          this.applyHeaders(header, res)
        } else if (header.key === 'Vary' && header.value) {
          vary(res, header.value)
        } else {
          res.setHeader(header.key, header.value)
        }
      }
    }
  }

  protected logNotAllowed(req: Request, options: CORSOptions) {
    const metadata = this.logger.getBaseMetadata(req) as LogEntry
    merge(metadata, {
      severity: 500, // ERROR
    })

    const data = this.getErrorData(req, options)

    this.logger.log(CORSValidator.LOG_NAME, metadata, data)
  }

  protected getErrorData(req: Request, options: CORSOptions) {
    return {
      ...this.logger.getBaseData(req),
      error: {
        message: 'Not allowed by CORS.',
        allowedBlankOrigin: !!options.allowedBlankOrigin,
        whitelist: options.whitelist,
      },
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

  protected get defaultOptions(): CORSOptions {
    return {
      ...super.defaultOptions,
      allowedBlankOrigin: true,
    }
  }

  protected logNotAllowed(req: Request, options: CORSOptions) {
    super.logNotAllowed(req, options)
    const detail = this.getErrorData(req, options)
    console.error('[ERROR]:', JSON.stringify(detail, null, 2))
  }

  /**
   * TODO 今後下記の問題が解消された場合、このメソッドのオーバーロードは削除する予定。
   *
   * クライアント側の単体テストでは jest.config.js で testURL: 'http://localhost/' が
   * 設定されている。単体テストを実行し、レスポンスヘッダーで Access-Control-Allow-Origin: http://localhost を返しても、クライアント側では "http://localhost, *" を受け取ったように
   * 変換されてしまい、"http://localhost" とオリジンが一致しないためCORSエラーとなってしまう。
   * このためリクエストオリジンが "http://localhost" の場合には強制的に "*" を返すよう設定している。
   */
  protected configureOrigin(options: CORSOptions, req: Request) {
    const requestOrigin = (req.headers.origin as string) || ''
    if (requestOrigin === 'http://localhost') {
      const headers: any = []
      headers.push({ key: 'Access-Control-Allow-Origin', value: '*' })
      headers.push({ key: 'Vary', value: 'Origin' })
      return headers
    } else {
      return super.configureOrigin(options, req)
    }
  }
}
