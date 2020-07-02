import { TimestampEntity } from '@/lib'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface Product extends TimestampEntity {
  title: string
  price: number
  stock: number
}

interface CartItem extends TimestampEntity {
  uid: string
  productId: string
  title: string
  price: number
  quantity: number
}

//========================================================================
//
//  Exports
//
//========================================================================

export { Product, CartItem }
