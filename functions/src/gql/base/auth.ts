import * as firebaseAdmin from 'firebase-admin'
import { AuthChecker, ResolverData } from 'type-graphql'
import { Context } from '../types'
import { LogEntry } from '@google-cloud/logging/build/src/entry'
import { Request } from 'express'
import { logging } from '../../base/logging'
const merge = require('lodash/merge')

//************************************************************************
//
//  Basis
//
//************************************************************************

export const authChecker: AuthChecker<Context> = async (action, roles) => {
  return authValidator.execute(action, roles)
}

class DecodeError extends Error {
  constructor(message: string, public readonly idToken: string) {
    super(message)
  }
}

abstract class AuthValidator {
  //----------------------------------------------------------------------
  //
  //  Constants
  //
  //----------------------------------------------------------------------

  private static readonly LOG_NAME = 'api'

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  execute: AuthChecker<Context> = async (action, roles) => {
    let idToken = this.m_getIdToken(action.context.req)
    if (!idToken) {
      this.logError(action, new Error('Failed to get ID token from HTTP request header.'))
      return false
    }

    let decodedIdToken: firebaseAdmin.auth.DecodedIdToken
    try {
      decodedIdToken = await this.decodeToken(idToken)
    } catch (err) {
      this.logError(action, new DecodeError('Failed to decode ID token.', idToken))
      return false
    }

    // コンテクストにデコードされたIDトークン(ユーザー情報)を設定
    action.context.setUser(decodedIdToken)
    // console.log('decodedIdToken:', decodedIdToken)

    return true
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  protected abstract decodeToken(idToken: string): Promise<firebaseAdmin.auth.DecodedIdToken>

  protected logError(action: ResolverData<Context>, err: Error) {
    const metadata = logging.getBaseMetadataByGQL(action) as LogEntry
    merge(metadata, {
      severity: 500, // ERROR
    })

    logging.log(AuthValidator.LOG_NAME, metadata, this.getErrorData(err))
  }

  protected getErrorData(
    err: Error
  ): {
    error: {
      message: string
    }
  } {
    const data = {
      error: {
        message: err.message,
      },
    }

    return data
  }

  private m_getIdToken(req: Request): string {
    // 認証リクエストがFirebase IDトークンを持っているかチェック
    const authorization = req.headers.authorization as string
    if ((!authorization || !authorization.startsWith('Bearer ')) && !req.cookies.__session) {
      return ''
    }

    let idToken
    // 認証ヘッダーにBearerトークンがある場合、認証ヘッダーからIDトークンを取得
    if (authorization && authorization.startsWith('Bearer ')) {
      idToken = authorization.split('Bearer ')[1]
    }
    // 認証ヘッダーにBearerトークンがない場合、cookieからIDトークンを取得
    else {
      idToken = req.cookies.__session
    }

    return idToken
  }
}

//************************************************************************
//
//  Concrete
//
//************************************************************************

class ProdAuthValidator extends AuthValidator {
  protected async decodeToken(idToken: string): Promise<firebaseAdmin.auth.DecodedIdToken> {
    let decodedIdToken = await firebaseAdmin.auth().verifyIdToken(idToken)
    return decodedIdToken
  }
}

class DevAuthValidator extends AuthValidator {
  protected async decodeToken(idToken: string): Promise<firebaseAdmin.auth.DecodedIdToken> {
    let decodedIdToken: firebaseAdmin.auth.DecodedIdToken
    try {
      decodedIdToken = await firebaseAdmin.auth().verifyIdToken(idToken)
    } catch (err) {
      // 開発環境用コード(主に単体テスト用)
      // 単体テストでは認証状態をつくり出すのが難しく暗号化されたIDトークンを生成できないため、
      // JSON形式のIDトークンが送られることを許容している。
      // ここでは送られてきたJSON文字列のIDトークンをパースしている。
      decodedIdToken = JSON.parse(idToken)
    }
    return decodedIdToken
  }

  protected logError(action: ResolverData<Context>, err: Error): void {
    const errorData = this.getErrorData(err)
    console.error('[ERROR]:', JSON.stringify(errorData, null, 2))
  }

  protected getErrorData(
    err: Error
  ): {
    error: {
      message: string
    }
  } {
    let data = super.getErrorData(err)

    if (err instanceof DecodeError) {
      merge(data.error, {
        idToken: err.idToken,
      })
    }

    return data
  }
}

const authValidator = (() => {
  let result: AuthValidator
  if (process.env.NODE_ENV === 'production') {
    result = new ProdAuthValidator()
  } else {
    result = new DevAuthValidator()
  }
  return result
})()
