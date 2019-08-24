import { Authorized, Body, CurrentUser, Get, JsonController, NotFoundError, Param, Put } from 'routing-controllers'
import { CartItem, UpdateCartItemInput } from '../types'
import { IdToken } from '../../../base'

const CART_ITEMS: CartItem[] = [
  {
    id: 'cartItem1',
    uid: '',
    productId: 'product1',
    title: 'iPad 4 Mini',
    price: 500.01,
    quantity: 1,
  },
  {
    id: 'cartItem2',
    uid: '',
    productId: 'product2',
    title: 'Fire HD 8 Tablet',
    price: 80.99,
    quantity: 2,
  },
]

@JsonController()
export class CartController {
  @Authorized()
  @Get('/rest/cartItems')
  getAll(@CurrentUser({ required: true }) user: IdToken) {
    return CART_ITEMS.map(item => {
      item.uid = user.uid
      return item
    })
  }

  @Authorized()
  @Get('/rest/cartItems/:id')
  getOne(@CurrentUser({ required: true }) user: IdToken, @Param('id') id: string) {
    const cartItem = CART_ITEMS.find(item => item.id === id)
    if (!cartItem) {
      throw new NotFoundError('Cart item was not found.')
    }
    cartItem.uid = user.uid
    return cartItem
  }

  @Authorized()
  @Put('/rest/cartItems/:id')
  put(@CurrentUser({ required: true }) user: IdToken, @Param('id') id: string, @Body() input: UpdateCartItemInput) {
    const cartItem = CART_ITEMS.find(item => item.id === id)
    if (!cartItem) {
      throw new NotFoundError('Cart item was not found.')
    }
    cartItem.uid = user.uid
    cartItem.quantity = input.quantity
    return cartItem
  }
}
