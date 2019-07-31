import * as express from 'express'
import { publicRouter } from '../../../base'

export default function hello(req: express.Request, res: express.Response) {
  console.log('/api/public/hello')
  const message = req.query.message
  res.send(`Public Hello ${message}`)
}

publicRouter.get('/hello', hello)
