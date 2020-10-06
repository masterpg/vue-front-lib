import { Component, Prop } from 'vue-property-decorator'
import { BaseStoragePage } from '../../base/storage'
import { StorageType } from '@/example/logic'

@Component
class UserStoragePage extends BaseStoragePage {
  @Prop({ default: 'user' })
  storageType!: StorageType
}

export default UserStoragePage
