import { GQLContext } from '../types'
import { createParamDecorator } from '@nestjs/common'

export const GQLCtx = createParamDecorator((data, [root, args, ctx, info]) => ctx as GQLContext)
