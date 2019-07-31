import { Field, Float, ID, InputType, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class CartItem {
  @Field(type => ID)
  id!: string

  @Field(type => ID)
  userId!: string

  @Field(type => ID)
  productId!: string

  @Field()
  title!: string

  @Field(type => Float)
  price!: number

  @Field(type => Int)
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
  quantity!: number
}

@InputType()
export class UpdateCartItemInput implements Partial<CartItem> {
  @Field(type => ID)
  id!: string

  @Field(type => Int)
  quantity!: number
}
