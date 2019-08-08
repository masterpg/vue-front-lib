import * as express from 'express'
import * as middlewares from '../base/middlewares'
import * as path from 'path'
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express'
import { CartResolver } from './modules/cart'
import { Context } from './types'
import { ProductResolver } from './modules/product'
import { RecipeResolver } from './modules/recipe'
import { TestResolver } from '../test/gql/'
import { authChecker } from './auth-checker'
import { buildSchemaSync } from 'type-graphql'
const cookieParser = require('cookie-parser')()

class ContextImpl implements Context {
  constructor(public readonly req: express.Request, public readonly res: express.Response) {}

  private m_user: any

  get user() {
    return this.m_user
  }

  setUser(user: any): void {
    this.m_user = user
  }
}

class GQLServer {
  constructor(app: express.Express) {
    const router = this.getRouter()
    app.use('/gql', router)
    const apolloServer = new ApolloServer(this.createConfig())
    apolloServer.applyMiddleware({ app: router, path: '/' })
  }

  protected getRouter(): express.Router {
    return express.Router().use(middlewares.cors(true), cookieParser)
  }

  protected get resolvers(): Array<Function | string> {
    return [CartResolver, ProductResolver, RecipeResolver]
  }

  protected createConfig(): ApolloServerExpressConfig {
    const schema = buildSchemaSync({
      resolvers: this.resolvers,
      // emitSchemaFile: path.resolve(__dirname, 'schema.gql'),
      authChecker: authChecker,
    })

    return {
      schema,
      context: async ({ req, res }) => {
        return new ContextImpl(req, res)
      },
    } as ApolloServerExpressConfig
  }
}

class GQLDevServer extends GQLServer {
  protected getRouter(): express.Router {
    return express.Router().use(cookieParser)
  }

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

export function initGQL(app: express.Express): void {
  if (process.env.NODE_ENV === 'production') {
    new GQLServer(app)
  } else {
    new GQLDevServer(app)
  }
}
