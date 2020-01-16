import { Component, Prop } from 'vue-property-decorator'
import StoragePage from '@/example/views/demo/storage/storage-page.vue'
import { StorageType } from '@/example/views/demo/storage/base'

@Component
class UserStoragePage extends StoragePage {
  @Prop({ default: 'user' })
  storageType!: StorageType
}

export default UserStoragePage
