import { Module } from '@nestjs/common'
import { ProductController } from './controller'
import { ProductService } from '../../services/product'

@Module({
  controllers: [ProductController],
  providers: [ProductService],
})
export class RESTProductModule {}
