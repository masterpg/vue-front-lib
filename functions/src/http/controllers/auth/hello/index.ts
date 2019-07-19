import * as express from 'express'
import { routers } from '../../../../base'

export default function hello(req: express.Request, res: express.Response) {
  console.log('/api/auth/hello')
  const message = req.query.message
  res.send(`Auth Hello ${message}`)
}

routers.auth.get('/hello', hello)
