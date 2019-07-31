import * as express from 'express'
import { authRouter } from '../../../base'

export default function hello(req: express.Request, res: express.Response) {
  console.log('/api/auth/hello')
  const message = req.query.message
  res.send(`Auth Hello ${message}`)
}

authRouter.get('/hello', hello)
