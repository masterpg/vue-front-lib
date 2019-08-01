import * as express from 'express'
import * as firebaseAdmin from 'firebase-admin'
import { authRouter } from '../../../base'

export default async function customToken(req: express.Request, res: express.Response) {
  console.log('/rest/auth/custom-token')
  const user = (req as any).user as firebaseAdmin.auth.DecodedIdToken
  const token = await firebaseAdmin.auth().createCustomToken(user.uid, {
    prime: true,
  })
  res.send(token)
}

authRouter.get('/custom-token', customToken)
