import * as express from 'express'
import { routers } from '../../../../base'

export default function hello(req: express.Request, res: express.Response) {
  console.log('/api/site/hello')
  const message = req.query.message
  res.send(`Site Hello ${message}`)
}

routers.site.get('/hello', hello)
