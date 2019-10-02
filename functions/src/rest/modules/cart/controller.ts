import { AuthRoleType, IdToken } from '../../../services/base'
import { Body, Controller, Get, Param, Put, UseGuards, UseInterceptors } from '@nestjs/common'
import { CartService, UpdateCartItem } from '../../services/cart'
import { Roles, TransformInterceptor, User } from '../../../nest'
import { CartItem } from '../../services/types'
import { RESTLoggingInterceptor } from '../../interceptors/logging'
import { UserGuard } from '../../../nest/guards/user'

@Controller('cartItems')
@UseInterceptors(RESTLoggingInterceptor, TransformInterceptor)
@UseGuards(UserGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async findAll(@User() user: IdToken): Promise<CartItem[]> {
    return this.cartService.findAll(user)
  }

  @Get(':id')
  async findOne(@User() user: IdToken, @Param('id') id: string): Promise<CartItem | undefined> {
    return this.cartService.findOne(user, id)
  }

  @Put(':id')
  @Roles(AuthRoleType.Admin)
  async update(@User() user: IdToken, @Param('id') id: string, @Body() input: UpdateCartItem) {
    return await this.cartService.update(user, id, input)
  }
}
