import * as express from 'express'
import * as middlewares from '../middlewares'
import * as path from 'path'
import { ApolloServer, ApolloServerExpressConfig } from 'apollo-server-express'
import { CartResolver, ProductResolver, RecipeResolver } from './modules'
import { Context } from './types'
import { GraphQLSchema } from 'graphql'
import { authChecker } from './auth-checker'
import { buildSchemaSync } from 'type-graphql'
const cookieParser = require('cookie-parser')()
const assign = require('lodash/assign')

function buildSchema(): GraphQLSchema {
  return buildSchemaSync({
    resolvers: [CartResolver, ProductResolver, RecipeResolver],
    // emitSchemaFile: path.resolve(__dirname, 'schema.gql'),
    authChecker,
  })
}

function setupApolloServer(router: express.Router, schema: GraphQLSchema) {
  const config = {
    schema,
    context: async ({ req, res }) => {
      return { req, res } as Context
    },
  } as ApolloServerExpressConfig
  if (process.env.NODE_ENV !== 'production') {
    assign(config, {
      debug: true,
      // graphiql gui を有効にする
      playground: true,
      introspection: true,
    })
  }
  const apolloServer = new ApolloServer(config)
  apolloServer.applyMiddleware({ app: router, path: '/' })
}

export function initGQL(app: express.Express) {
  const router = express.Router().use(middlewares.cors(true), cookieParser)
  app.use('/', router)
  setupApolloServer(router, buildSchema())
}
