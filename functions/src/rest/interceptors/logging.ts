import { CallHandler, ExecutionContext, Inject, NestInterceptor } from '@nestjs/common'
import { Logger, LoggingLatencyTimer } from '../../services/base'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

export class RESTLoggingInterceptor implements NestInterceptor {
  constructor(@Inject(Logger) protected readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp()

    const req = httpContext.getRequest()
    const res = httpContext.getResponse()
    const latencyTimer = new LoggingLatencyTimer().start()
    const loggingSource = { req, res, latencyTimer }

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
