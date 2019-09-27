import { CallHandler, ExecutionContext, Inject, NestInterceptor } from '@nestjs/common'
import { Logger, LoggingLatencyTimer } from '../../services/base'
import { GQLContext } from '../types'
import { GqlExecutionContext } from '@nestjs/graphql'
import { GraphQLResolveInfo } from 'graphql'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

export class GQLLoggingInterceptor implements NestInterceptor {
  constructor(@Inject(Logger) protected readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlExecContext = GqlExecutionContext.create(context)
    const gqlContext = gqlExecContext.getContext<GQLContext>()

    const req = gqlContext.req
    const res = gqlContext.res
    const info = gqlExecContext.getInfo<GraphQLResolveInfo>()
    const latencyTimer = new LoggingLatencyTimer().start()
    const loggingSource = { req, res, info, latencyTimer }

    return next.handle().pipe(
      tap(
        () => {
          loggingSource.res.on('finish', () => {
            this.logger.log(loggingSource)
          })
        },
        error => {
          loggingSource.res.on('finish', () => {
            this.logger.log(Object.assign(loggingSource, { error }))
          })
        }
      )
    )
  }
}
