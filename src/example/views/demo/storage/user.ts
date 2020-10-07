import { Component, Prop } from 'vue-property-decorator'
import { BaseStoragePage } from '@/example/views/base/storage'
import { StorageType } from '@/example/logic'

@Component
class UserStoragePage extends BaseStoragePage {
  @Prop({ default: 'user' })
  storageType!: StorageType
}

export default UserStoragePage
