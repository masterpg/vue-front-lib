import 'reflect-metadata'
import * as admin from 'firebase-admin'
import * as express from 'express'
import * as functions from 'firebase-functions'
import { initAPI } from './api'
import { initGQL } from './gql'

const serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const app = express()

export const api = (function() {
  initAPI(app)
  return functions.region('asia-northeast1').https.onRequest(app)
})()

export const gql = (() => {
  initGQL(app)
  return functions.region('asia-northeast1').https.onRequest(app)
})()
