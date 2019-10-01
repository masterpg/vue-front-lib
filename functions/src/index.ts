import 'reflect-metadata'
import * as express from 'express'
import * as functions from 'firebase-functions'
import { AppModule } from './app.module'
import { ExpressAdapter } from '@nestjs/platform-express'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { config } from './base/config'
import { initFirebaseApp } from './base/firebase'

initFirebaseApp()

const server = express()

const createNestServer = async (expressInstance: express.Express) => {
  const httpAdapter = new ExpressAdapter(expressInstance)
  const app = await NestFactory.create(AppModule, httpAdapter, {
    logger: ['error', 'warn'],
    // GraphQL+CORSにおける不具合の対応:
    // ここで`origin: false`を設定しないとする。そうすると、プリフライトリクエストが許可しない
    // オリジンだった場合、後続の`CORSMiddleware`で`Access-Control-Allow-Origin: false`を
    // 設定してもうまく設定されず`Access-Control-Allow-Origin: *`がレスポンスされてしまう。
    // この不具合に対応するため、ここで`origin: false`を設定している。
    cors: { origin: false },
  })

  // app.enableCors({
  //   origin: 'http://localhost:5678',
  //   allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  // })

  // app.useGlobalPipes(new ValidationPipe())
  return app.init()
}

createNestServer(server)
  // .then(v => console.log('Nest Ready'))
  .catch(err => console.error('Nest broken', err))

export const api = functions.region(config.functions.region).https.onRequest(server)
