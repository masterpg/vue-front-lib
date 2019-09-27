import { Global, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common'
import { authServiceProvider, corsServiceProvider, loggerProvider } from './services/base'
import { CORSMiddleware } from './nest/middleware/cors'
import { GQLContainerModule } from './gql'
import { RESTContainerModule } from './rest'

@Global()
@Module({
  providers: [corsServiceProvider, authServiceProvider, loggerProvider],
  exports: [corsServiceProvider, authServiceProvider, loggerProvider],
})
class AppBaseModule {}

@Module({
  imports: [AppBaseModule, GQLContainerModule, RESTContainerModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CORSMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
