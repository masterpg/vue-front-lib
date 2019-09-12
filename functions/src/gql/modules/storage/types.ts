import { Field, ObjectType, registerEnumType } from 'type-graphql'

@ObjectType()
export class StorageNode {
  @Field(type => StorageNodeType)
  nodeType!: StorageNodeType

  @Field()
  name!: string

  @Field()
  dir!: string

  @Field()
  path!: string
}

export enum StorageNodeType {
  File,
  Dir,
}

registerEnumType(StorageNodeType, {
  name: 'StorageNodeType',
})
