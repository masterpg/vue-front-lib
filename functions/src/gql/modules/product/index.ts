import { Module } from '@nestjs/common'
import { ProductResolver } from './resolver'
import { ProductService } from '../../../services/business'

@Module({
  providers: [ProductService, ProductResolver],
})
export class GQLProductModule {}
