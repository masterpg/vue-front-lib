import { Field, InputType, ObjectType, registerEnumType } from 'type-graphql'
import { IStorageNode, StorageNodeType } from '../../../base/storage'

@ObjectType()
export class StorageNode implements IStorageNode {
  @Field(type => StorageNodeType)
  nodeType!: StorageNodeType

  @Field()
  name!: string

  @Field()
  dir!: string

  @Field()
  path!: string
}

@InputType()
export class SignedUploadUrlParam {
  @Field(type => String)
  filePath!: string

  @Field(type => String, { nullable: true })
  contentType!: string
}

registerEnumType(StorageNodeType, {
  name: 'StorageNodeType',
})

export { StorageNodeType }
