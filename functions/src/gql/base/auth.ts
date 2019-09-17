import { AuthChecker } from 'type-graphql'
import { AuthValidator } from '../../base/auth'
import { Context } from '../types'
import { DITypes } from '../../di.types'
import { GQLLogger } from './logging'
import { LoggingLatencyTimer } from '../../base/logging'
import { container } from 'tsyringe'

export const authChecker: AuthChecker<Context> = async (action, roles) => {
  const gqlLogger = container.resolve<GQLLogger>(DITypes.GQLLogger)
  const latencyTimer = new LoggingLatencyTimer().start()

  const authValidator = container.resolve<AuthValidator>(DITypes.AuthValidator)
  const validated = await authValidator.execute(action.context.req, roles, action.info)
  if (validated.result) {
    action.context.setUser(validated.idToken!)
    return true
  } else {
    action.context.res.on('finish', function onFinish() {
      gqlLogger.logError(new Error(validated.errorMessage), action, latencyTimer)
    })
    return false
  }
}
