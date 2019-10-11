import { Response } from 'supertest'
const request = require('supertest')

export function verifyGQLNotSignInCase(
  app: any,
  gql: {
    query?: string
    variables?: Record<string, any>
  },
  options: {
    headers?: { [field: string]: any }
  } = {}
): Promise<void> {
  const headers: { [field: string]: any } = {}
  if (options.headers) {
    Object.assign(headers, options.headers)
  }
  return request(app.getHttpServer())
    .post('/gql')
    .send(gql)
    .set('Content-Type', 'application/json')
    .set(headers)
    .expect(200)
    .then((res: Response) => {
      expect(res.body.errors[0].extensions.exception.status).toBe(403)
    })
}
