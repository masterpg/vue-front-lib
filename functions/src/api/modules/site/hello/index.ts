import * as express from 'express'
import { siteRouter } from '../../../base'

export default function hello(req: express.Request, res: express.Response) {
  console.log('/api/site/hello')
  const message = req.query.message
  res.send(`Site Hello ${message}`)
}

siteRouter.get('/hello', hello)
