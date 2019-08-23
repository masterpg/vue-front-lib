import { IsPositive } from 'class-validator'
// import { IsPositive } from 'routing-controllers/node_modules/class-validator'

export interface Product {
  id: string
  title: string
  price: number
  stock: number
}

export interface CartItem {
  id: string
  uid: string
  productId: string
  title: string
  price: number
  quantity: number
}

export class UpdateCartItemInput {
  @IsPositive()
  quantity!: number
}
