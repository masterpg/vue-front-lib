import { Dayjs } from 'dayjs'

//========================================================================
//
//  Interfaces
//
//========================================================================

//--------------------------------------------------
//  Foundation
//--------------------------------------------------

interface Entity {
  id: string
}

interface TimestampEntity extends Entity {
  createdAt: Dayjs
  updatedAt: Dayjs
}

type OmitEntityTimestamp<T> = Omit<T, 'createdAt' | 'updatedAt'>

//--------------------------------------------------
//  Application
//--------------------------------------------------

interface User extends TimestampEntity {
  email: string
  displayName: string
}

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
//  Export
//
//========================================================================

export { Entity, TimestampEntity, OmitEntityTimestamp, User, Product, CartItem }
