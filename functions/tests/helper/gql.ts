import { Response } from 'supertest'
const request = require('supertest')

export function verifyGQLNotSignInCase(
  app: any,
  data: {
    query?: string
    variables?: Object
  }
): Promise<void> {
  return request(app.getHttpServer())
    .post('/gql')
    .send(data)
    .set('Content-Type', 'application/json')
    .expect(200)
    .then((res: Response) => {
      expect(res.body.errors[0].extensions.exception.status).toBe(403)
    })
}
