import { Field, Float, ID, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class Product {
  @Field(type => ID)
  id!: string

  @Field()
  title!: string

  @Field(type => Float)
  price!: number

  @Field(type => Int)
  stock!: number
}
