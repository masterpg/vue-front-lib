import { CartItem, Product, User } from '@/app/logic/types'
import dayjs from 'dayjs'

type StatePartial<T> = Partial<Omit<T, 'id'>> & { id: string }

namespace StoreUtil {
  export function generateId(): string {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let autoId = ''
    for (let i = 0; i < 20; i++) {
      autoId += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
    }
    return autoId
  }

  export function populateUser(from: Partial<User>, to: Partial<User>): User {
    if (typeof from.id === 'string') to.id = from.id
    if (typeof from.email === 'string') to.email = from.email
    if (typeof from.displayName === 'string') to.displayName = from.displayName
    if (from.createdAt) to.createdAt = dayjs(from.createdAt)
    if (from.updatedAt) to.updatedAt = dayjs(from.updatedAt)
    return to as User
  }

  export function cloneUser(source: User): User {
    return populateUser(source, {})
  }

  export function cloneUsers(source: User[]): User[] {
    return source.map(item => cloneUser(item))
  }

  export function populateProduct(from: Partial<Product>, to: Partial<Product>): Product {
    if (typeof from.id === 'string') to.id = from.id
    if (typeof from.title === 'string') to.title = from.title
    if (typeof from.price === 'number') to.price = from.price
    if (typeof from.stock === 'number') to.stock = from.stock
    if (from.createdAt) to.createdAt = dayjs(from.createdAt)
    if (from.updatedAt) to.updatedAt = dayjs(from.updatedAt)
    return to as Product
  }

  export function cloneProduct(source: Product): Product {
    return populateProduct(source, {})
  }

  export function cloneProducts(source: Product[]): Product[] {
    return source.map(item => cloneProduct(item))
  }

  export function populateCartItem(from: Partial<CartItem>, to: Partial<CartItem>): CartItem {
    if (typeof from.id === 'string') to.id = from.id
    if (typeof from.uid === 'string') to.uid = from.uid
    if (typeof from.productId === 'string') to.productId = from.productId
    if (typeof from.title === 'string') to.title = from.title
    if (typeof from.price === 'number') to.price = from.price
    if (typeof from.quantity === 'number') to.quantity = from.quantity
    if (from.createdAt) to.createdAt = dayjs(from.createdAt)
    if (from.updatedAt) to.updatedAt = dayjs(from.updatedAt)
    return to as CartItem
  }

  export function cloneCartItem(source: CartItem): CartItem {
    return populateCartItem(source, {})
  }

  export function cloneCartItems(source: CartItem[]): CartItem[] {
    return source.map(item => cloneCartItem(item))
  }
}

export { StatePartial, StoreUtil }
