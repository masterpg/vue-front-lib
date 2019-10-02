import { Controller, Get, Param, UseInterceptors } from '@nestjs/common'
import { Product } from './types'
import { ProductService } from '../../services/product'
import { RESTLoggingInterceptor } from '../../interceptors/logging'
import { TransformInterceptor } from '../../../nest'

@Controller('products')
@UseInterceptors(RESTLoggingInterceptor, TransformInterceptor)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(): Promise<Product[]> {
    return this.productService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product | undefined> {
    return this.productService.findOne(id)
  }
}
