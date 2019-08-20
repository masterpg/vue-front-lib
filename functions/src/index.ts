import 'reflect-metadata'
import * as admin from 'firebase-admin'
import * as express from 'express'
import * as functions from 'firebase-functions'
import { config } from './base'
import { initDI } from './di.config'
import { initREST } from './rest'

const serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

export const api = (function() {
  const app = express()
  initDI(app)
  initREST(app)
  return functions.region(config.functions.region).https.onRequest(app)
})()
