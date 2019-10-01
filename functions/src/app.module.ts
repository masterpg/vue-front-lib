import { Global, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common'
import { authServiceProvider, corsServiceProvider, firestoreServiceProvider, loggerProvider } from './services/base'
import { CORSMiddleware } from './nest/middleware/cors'
import { GQLContainerModule } from './gql'
import { RESTContainerModule } from './rest'

@Global()
@Module({
  providers: [corsServiceProvider, authServiceProvider, loggerProvider, firestoreServiceProvider],
  exports: [corsServiceProvider, authServiceProvider, loggerProvider, firestoreServiceProvider],
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
