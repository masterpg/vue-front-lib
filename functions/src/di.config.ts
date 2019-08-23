import { DevAuthValidator, ProdAuthValidator } from './base/auth'
import { DevCORSValidator, ProdCORSValidator } from './base/cors'
import { DevGQLLogger, ProdGQLLogger } from './gql/base'
import { DevGQLServer, ProdGQLServer } from './gql'
import { DevHTTPLogger, ProdHTTPLogger } from './http/base'
import { DevLogger, ProdLogger } from './base/logging'
import { DITypes } from './di.types'
import { Express } from 'express'
import { container } from 'tsyringe'

export function initDI(app: Express): void {
  if (process.env.NODE_ENV === 'production') {
    container.register(DITypes.GQLServer, { useValue: new ProdGQLServer(app) })
    container.register(DITypes.Logger, { useClass: ProdLogger })
    container.register(DITypes.GQLLogger, { useClass: ProdGQLLogger })
    container.register(DITypes.CORSValidator, { useClass: ProdCORSValidator })
    container.register(DITypes.AuthValidator, { useClass: ProdAuthValidator })
    container.register(DITypes.HTTPLogger, { useClass: ProdHTTPLogger })
  } else {
    container.register(DITypes.GQLServer, { useValue: new DevGQLServer(app) })
    container.register(DITypes.Logger, { useClass: DevLogger })
    container.register(DITypes.GQLLogger, { useClass: DevGQLLogger })
    container.register(DITypes.CORSValidator, { useClass: DevCORSValidator })
    container.register(DITypes.AuthValidator, { useClass: DevAuthValidator })
    container.register(DITypes.HTTPLogger, { useClass: DevHTTPLogger })
  }
}
