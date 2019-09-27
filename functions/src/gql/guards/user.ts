import { AuthService, Logger, LoggingLatencyTimer } from '../../services/base'
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { GQLContext } from '../types'
import { GqlExecutionContext } from '@nestjs/graphql'
import { GraphQLResolveInfo } from 'graphql'
import { Reflector } from '@nestjs/core'

@Injectable()
export class GQLUserGuard implements CanActivate {
  constructor(
    protected readonly reflector: Reflector,
    @Inject(AuthService) protected readonly authService: AuthService,
    @Inject(Logger) protected readonly logger: Logger
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler())
    const gqlExecContext = GqlExecutionContext.create(context)
    const gqlContext = gqlExecContext.getContext<GQLContext>()
    const req = gqlContext.req
    const res = gqlContext.res
    const info = gqlExecContext.getInfo<GraphQLResolveInfo>()
    const latencyTimer = new LoggingLatencyTimer().start()

    const validated = await this.authService.validate(req, roles)
    if (validated.result) {
      ;(req as any).__idToken = validated.idToken
      return true
    } else {
      res.on('finish', () => {
        this.logger.log({ req, res, info, latencyTimer, error: new Error(validated.errorMessage) })
      })
      return false
    }
  }
}
