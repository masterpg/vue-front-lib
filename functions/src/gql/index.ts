import * as path from 'path'
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express'
import { AppResolver, CartResolver, ProductResolver, RecipeResolver } from './modules'
import { Express, Request, Response, Router } from 'express'
import { LoggingMiddleware, authChecker } from './base'
import { Context } from './types'
import { IdToken } from '../base'
import { TestResolver } from '../test/gql'
import { buildSchemaSync } from 'type-graphql'
import { singleton } from 'tsyringe'
const cookieParser = require('cookie-parser')()

//************************************************************************
//
//  Basis
//
//************************************************************************

class ContextImpl implements Context {
  constructor(public readonly req: Request, public readonly res: Response) {}

  private m_user: IdToken | undefined

  get user(): IdToken | undefined {
    return this.m_user
  }

  setUser(user: IdToken): void {
    this.m_user = user
  }
}

abstract class GQLServer {
  constructor(app: Express) {
    const router = this.getRouter()
    app.use('/gql', router)
    const apolloServer = new ApolloServer(this.createConfig())
    apolloServer.applyMiddleware({ app: router, path: '/' })
  }

  protected getRouter(): Router {
    return Router().use(cookieParser)
  }

  protected get resolvers(): Array<Function | string> {
    return [AppResolver, CartResolver, ProductResolver, RecipeResolver]
  }

  protected createConfig(): ApolloServerExpressConfig {
    const schema = buildSchemaSync({
      resolvers: this.resolvers,
      // emitSchemaFile: path.resolve(__dirname, 'schema.gql'),
      authChecker: authChecker,
      globalMiddlewares: [LoggingMiddleware],
    })

    return {
      schema,
      context: async ({ req, res }) => {
        return new ContextImpl(req, res)
      },
    } as ApolloServerExpressConfig
  }
}

//************************************************************************
//
//  Concrete
//
//************************************************************************

@singleton()
export class ProdGQLServer extends GQLServer {}

@singleton()
export class DevGQLServer extends GQLServer {
  protected createConfig(): ApolloServerExpressConfig {
    return {
      ...super.createConfig(),
      debug: true,
      // graphiql gui を有効にする
      playground: true,
      introspection: true,
    }
  }

  protected get resolvers(): Array<Function | string> {
    return [...super.resolvers, TestResolver]
  }
}
