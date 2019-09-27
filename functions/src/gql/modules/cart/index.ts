import { CartResolver } from './resolver'
import { CartService } from '../../../services/business'
import { Module } from '@nestjs/common'

@Module({
  providers: [CartService, CartResolver],
})
export class GQLCartModule {}
