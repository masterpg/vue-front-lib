import { Component, Prop } from 'vue-property-decorator'
import { StoragePage, StorageType } from '../../base/storage'

@Component
class UserStoragePage extends StoragePage {
  @Prop({ default: 'user' })
  storageType!: StorageType
}

export default UserStoragePage
