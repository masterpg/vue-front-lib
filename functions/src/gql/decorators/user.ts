import { GQLContext } from '../types'
import { createParamDecorator } from '@nestjs/common'

export const GQLUser = createParamDecorator((data, [root, args, ctx, info]) => {
  const gqlContext = ctx as GQLContext
  return (gqlContext.req as any).__idToken
})
