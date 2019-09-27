import { createParamDecorator } from '@nestjs/common'

export const RESTUser = createParamDecorator((data, req) => {
  return (req as any).__idToken
})
