import { DevAuthValidator, DevGQLLogger, ProdAuthValidator, ProdGQLLogger } from './gql/base'
import { DevCORSValidator, ProdCORSValidator } from './base/middlewares/cors'
import { DevGQLServer, ProdGQLServer } from './gql'
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
  } else {
    container.register(DITypes.GQLServer, { useValue: new DevGQLServer(app) })
    container.register(DITypes.Logger, { useClass: DevLogger })
    container.register(DITypes.GQLLogger, { useClass: DevGQLLogger })
    container.register(DITypes.CORSValidator, { useClass: DevCORSValidator })
    container.register(DITypes.AuthValidator, { useClass: DevAuthValidator })
  }
}
