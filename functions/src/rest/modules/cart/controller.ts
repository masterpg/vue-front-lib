import { AuthRoleType, IdToken } from '../../../services/base'
import { Body, Controller, Get, Param, Put, UseGuards, UseInterceptors } from '@nestjs/common'
import { CartService, UpdateCartItem } from '../../services/cart'
import { CartItem } from '../../services/types'
import { RESTLoggingInterceptor } from '../../interceptors/logging'
import { RESTUser } from '../../decorators/user'
import { RESTUserGuard } from '../../guards/user'
import { Roles } from '../../../nest/decorators/roles'
import { TransformInterceptor } from '../../../nest/interceptors/transform'

@Controller('cartItems')
@UseInterceptors(RESTLoggingInterceptor, TransformInterceptor)
@UseGuards(RESTUserGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async findAll(@RESTUser() user: IdToken): Promise<CartItem[]> {
    return this.cartService.findAll(user)
  }

  @Get(':id')
  async findOne(@RESTUser() user: IdToken, @Param('id') id: string): Promise<CartItem | undefined> {
    return this.cartService.findOne(user, id)
  }

  @Put(':id')
  @Roles(AuthRoleType.Admin)
  async update(@RESTUser() user: IdToken, @Param('id') id: string, @Body() input: UpdateCartItem) {
    return await this.cartService.update(user, id, input)
  }
}
