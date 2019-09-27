import { CartController } from './controller'
import { CartService } from '../../services/cart'
import { Module } from '@nestjs/common'

@Module({
  controllers: [CartController],
  providers: [CartService],
})
export class RESTCartModule {}
