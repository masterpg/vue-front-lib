import 'reflect-metadata'
import * as admin from 'firebase-admin'
import * as express from 'express'
import * as functions from 'firebase-functions'
import { config } from './base/config'
import { corsMiddleware } from './base/cors'
import { initDI } from './di.config'
import { initHTTP } from './http'

const serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: config.storage.bucket,
})

export const api = (function() {
  const app = express().use(corsMiddleware)
  initDI(app)
  initHTTP(app)
  return functions.region(config.functions.region).https.onRequest(app)
})()
