import { Args, Query, Resolver } from '@nestjs/graphql'
import { Product, ProductService } from '../../../services/business'
import { GQLLoggingInterceptor } from '../../interceptors/logging'
import { UseInterceptors } from '@nestjs/common'

@Resolver('Product')
@UseInterceptors(GQLLoggingInterceptor)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query('products')
  async products(@Args('ids') ids?: string[]): Promise<Product[]> {
    return this.productService.find(ids)
  }
}
