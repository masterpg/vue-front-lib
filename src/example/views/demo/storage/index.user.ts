import { Component, Prop } from 'vue-property-decorator'
import StoragePage from './storage-page.vue'
import { StorageType } from './base'

@Component
class UserStoragePage extends StoragePage {
  @Prop({ default: 'user' })
  storageType!: StorageType
}

export default UserStoragePage
