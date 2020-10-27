import { DeepPartial } from 'web-base-lib'
import { TimestampEntity } from '@/app/logic'
import dayjs from 'dayjs'

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
//  Implementation
//
//========================================================================

namespace Product {
  export function populate(from: DeepPartial<Product>, to: DeepPartial<Product>): Product {
    if (typeof from.id === 'string') to.id = from.id
    if (typeof from.title === 'string') to.title = from.title
    if (typeof from.price === 'number') to.price = from.price
    if (typeof from.stock === 'number') to.stock = from.stock
    if (dayjs.isDayjs(from.createdAt)) to.createdAt = dayjs(from.createdAt)
    if (dayjs.isDayjs(from.updatedAt)) to.updatedAt = dayjs(from.updatedAt)
    return to as Product
  }

  export function clone<T extends Product | Product[]>(source: T): T {
    if (Array.isArray(source)) {
      return (source as Product[]).map(item => clone(item)) as T
    } else {
      return populate(source as Product, {}) as T
    }
  }
}

namespace CartItem {
  export function populate(from: DeepPartial<CartItem>, to: DeepPartial<CartItem>): CartItem {
    if (typeof from.id === 'string') to.id = from.id
    if (typeof from.uid === 'string') to.uid = from.uid
    if (typeof from.productId === 'string') to.productId = from.productId
    if (typeof from.title === 'string') to.title = from.title
    if (typeof from.price === 'number') to.price = from.price
    if (typeof from.quantity === 'number') to.quantity = from.quantity
    if (dayjs.isDayjs(from.createdAt)) to.createdAt = dayjs(from.createdAt)
    if (dayjs.isDayjs(from.updatedAt)) to.updatedAt = dayjs(from.updatedAt)
    return to as CartItem
  }

  export function clone<T extends CartItem | CartItem[]>(source: T): T {
    if (Array.isArray(source)) {
      return (source as CartItem[]).map(item => clone(item)) as T
    } else {
      return populate(source as CartItem, {}) as T
    }
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { Product, CartItem }
