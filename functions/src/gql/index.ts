import * as path from 'path'
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express'
import { Express, Request, Response, Router } from 'express'
import { LoggingMiddleware, authChecker } from './base'
import { config, middlewares } from '../base'
import { CartResolver } from './modules/cart'
import { Context } from './types'
import { ProductResolver } from './modules/product'
import { RecipeResolver } from './modules/recipe'
import { TestResolver } from '../test/gql/'
import { buildSchemaSync } from 'type-graphql'
const cookieParser = require('cookie-parser')()

//************************************************************************
//
//  Basis
//
//************************************************************************

class ContextImpl implements Context {
  constructor(public readonly req: Request, public readonly res: Response) {}

  private m_user: any

  get user() {
    return this.m_user
  }

  setUser(user: any): void {
    this.m_user = user
  }
}

class GQLServer {
  constructor(app: Express) {
    const router = this.getRouter()
    app.use('/gql', router)
    const apolloServer = new ApolloServer(this.createConfig())
    apolloServer.applyMiddleware({ app: router, path: '/' })
  }

  protected getRouter(): Router {
    return Router().use(middlewares.cors({ whitelist: config.cors.whitelist }), cookieParser)
  }

  protected get resolvers(): Array<Function | string> {
    return [CartResolver, ProductResolver, RecipeResolver]
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

class GQLDevServer extends GQLServer {
  protected createConfig(): ApolloServerExpressConfig {
    return {
      ...super.createConfig(),
      debug: true,
      // graphiql gui を有効にする
      playground: true,
      introspection: true,
    }
  }

  protected getRouter(): Router {
    return Router().use(cookieParser)
    // return Router().use(expressUtils.middlewares.cors({ whitelist: config.cors.whitelist }), cookieParser)
  }

  protected get resolvers(): Array<Function | string> {
    return [...super.resolvers, TestResolver]
  }
}

//************************************************************************
//
//  Export
//
//************************************************************************

export function initGQL(app: Express): void {
  if (process.env.NODE_ENV === 'production') {
    new GQLServer(app)
  } else {
    new GQLDevServer(app)
  }
}
