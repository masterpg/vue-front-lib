import * as firebaseAdmin from 'firebase-admin'
import * as http from './http'

const serviceAccount = require('./serviceAccountKey.json')
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
})

const httpFunctions = http.init()
export const api = httpFunctions.api

// import * as functions from 'firebase-functions'
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   response.send('Hello from Firebase!\n\n')
// })

// const functions = require('firebase-functions')
// const express = require('express')
// const app = express()
// app.get('/hello', (req: any, res: any) => {
//   res.send('Hello World!')
// })
// exports.app = functions.https.onRequest(app)
