import { AddCartItemInput, CartItem, CartService, EditCartItemResponse, UpdateCartItemInput } from '../../../services/business'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { GQLLoggingInterceptor } from '../../interceptors/logging'
import { GQLUser } from '../../decorators/user'
import { GQLUserGuard } from '../../guards/user'
import { IdToken } from '../../../services/base'

@Resolver('CartItem')
@UseInterceptors(GQLLoggingInterceptor)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Query()
  @UseGuards(GQLUserGuard)
  async cartItems(@GQLUser() user: IdToken, @Args('ids') ids?: string[]): Promise<CartItem[]> {
    return this.cartService.getCartItems(user, ids)
  }

  @Mutation()
  @UseGuards(GQLUserGuard)
  async updateCartItems(@GQLUser() user: IdToken, @Args('inputs') inputs: UpdateCartItemInput[]): Promise<EditCartItemResponse[]> {
    return this.cartService.updateCartItems(user, inputs)
  }

  @Mutation()
  @UseGuards(GQLUserGuard)
  async addCartItems(@GQLUser() user: IdToken, @Args('inputs') inputs: AddCartItemInput[]): Promise<EditCartItemResponse[]> {
    return this.cartService.addCartItems(user, inputs)
  }

  @Mutation()
  @UseGuards(GQLUserGuard)
  async removeCartItems(@GQLUser() user: IdToken, @Args('ids') ids: string[]): Promise<EditCartItemResponse[]> {
    return this.cartService.removeCartItems(user, ids)
  }

  @Mutation()
  @UseGuards(GQLUserGuard)
  async checkoutCart(@GQLUser() user: IdToken): Promise<boolean> {
    return this.cartService.checkoutCart(user)
  }
}
