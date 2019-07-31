import * as firebaseAdmin from 'firebase-admin'
import { AuthChecker } from 'type-graphql'
import { Context } from './types'

export const authChecker: AuthChecker<Context> = async ({ context }: { context: Context }, roles) => {
  const req = context.req

  // 認証リクエストがFirebase IDトークンを持っているかチェック
  const authorization = req.headers.authorization as string
  if ((!authorization || !authorization.startsWith('Bearer ')) && !req.cookies.__session) {
    console.error(
      '認証ヘッダーにBearerトークンとしてFirebase IDが渡されませんでした。',
      'HTTPヘッダーの`Authorization: Bearer <Firebase ID Token>`でリクエストを承認するか、',
      'cookieの`__session`で承認を行ってください。'
    )
    return false
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
  // console.log('idToken:', idToken)

  // IDトークンの検証とデコード
  let decodedIdToken: firebaseAdmin.auth.DecodedIdToken
  try {
    decodedIdToken = await firebaseAdmin.auth().verifyIdToken(idToken)
  } catch (err) {
    console.error('Firebase IDトークンの検証中にエラーが発生しました:', err)
    return false
  }

  ;(req as any).user = decodedIdToken
  // console.log('decodedIdToken:', decodedIdToken)

  return true
}
