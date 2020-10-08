import { Component, Prop } from 'vue-property-decorator'
import { BaseStoragePage } from '@/app/views/base/storage'
import { StorageType } from '@/app/logic'

@Component
class UserStoragePage extends BaseStoragePage {
  @Prop({ default: 'user' })
  storageType!: StorageType
}

export default UserStoragePage
