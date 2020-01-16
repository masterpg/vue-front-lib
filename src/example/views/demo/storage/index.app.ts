import { Component, Prop } from 'vue-property-decorator'
import StoragePage from '@/example/views/demo/storage/storage-page.vue'
import { StorageType } from '@/example/views/demo/storage/base'

@Component
class AppStoragePage extends StoragePage {
  @Prop({ default: 'app' })
  storageType!: StorageType
}

export default AppStoragePage
