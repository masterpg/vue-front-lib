import { Field, Float, ID, InputType, Int, ObjectType } from 'type-graphql'
import { IsPositive } from 'class-validator'
import { Product } from '../product/types'

@ObjectType()
export class CartItem {
  @Field(type => ID)
  id!: string

  @Field(type => ID)
  uid!: string

  @Field(type => ID)
  productId!: string

  @Field()
  title!: string

  @Field(type => Float)
  price!: number

  @Field(type => Int)
  @IsPositive()
  quantity!: number
}

@InputType()
export class AddCartItemInput implements Partial<CartItem> {
  @Field(type => ID)
  productId!: string

  @Field(type => String)
  title!: string

  @Field(type => Float)
  price!: number

  @Field(type => Int)
  @IsPositive()
  quantity!: number
}

@InputType()
export class UpdateCartItemInput implements Partial<CartItem> {
  @Field(type => ID)
  id!: string

  @Field(type => Int)
  @IsPositive()
  quantity!: number
}

@ObjectType()
export class EditCartItemResponse extends CartItem {
  @Field(type => Product)
  product!: Product
}

@InputType()
export class ExampleInput {
  @Field(type => ID)
  id!: string

  @Field(type => Int)
  @IsPositive()
  quantity!: number
}
