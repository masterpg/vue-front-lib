import { AuthValidator } from '../../base/auth'
import { AuthorizationChecker } from 'routing-controllers/AuthorizationChecker'
import { CurrentUserChecker } from 'routing-controllers/CurrentUserChecker'
import { DITypes } from '../../di.types'
import { container } from 'tsyringe'

export const authorizationChecker: AuthorizationChecker = async (action, roles: string[]) => {
  const authValidator = container.resolve<AuthValidator>(DITypes.AuthValidator)
  const validated = await authValidator.execute(action.request, roles)
  if (validated.result) {
    // ログ用にIDトークン(ユーザー情報)をリクエストに埋め込む
    ;(action.request as any).__idToken = validated.idToken
  } else {
    // ログ用に認証エラーメッセージをリクエストに埋め込む
    ;(action.request as any).__authErrorMessage = validated.errorMessage
  }
  return validated.result
}

export const currentUserChecker: CurrentUserChecker = async action => {
  const authValidator = container.resolve<AuthValidator>(DITypes.AuthValidator)
  return await authValidator.getIdToken(action.request)
}
