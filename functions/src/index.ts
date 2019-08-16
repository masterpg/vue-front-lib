import 'reflect-metadata'
import * as admin from 'firebase-admin'
import * as express from 'express'
import * as functions from 'firebase-functions'
import { config } from './base'
import { initGQL } from './gql'
import { initREST } from './rest'

const serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

export const api = (function() {
  const app = express()
  initREST(app)
  initGQL(app)
  return functions.region(config.functions.region).https.onRequest(app)
})()
