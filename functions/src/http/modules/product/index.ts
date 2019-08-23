import { Controller, Get, NotFoundError, Param } from 'routing-controllers'
import { Product } from '../types'

const PRODUCTS: Product[] = [
  { id: 'product1', title: 'iPad 4 Mini', price: 500.01, stock: 3 },
  { id: 'product2', title: 'Fire HD 8 Tablet', price: 80.99, stock: 5 },
  { id: 'product3', title: 'MediaPad T5 10', price: 150.8, stock: 10 },
]

@Controller()
export class ProductController {
  @Get('/rest/products')
  getAll() {
    return PRODUCTS
  }

  @Get('/rest/products/:id')
  getOne(@Param('id') id: string) {
    const product = PRODUCTS.find(item => item.id === id)
    if (!product) {
      throw new NotFoundError('Product was not found.')
    }
    return product
  }
}
