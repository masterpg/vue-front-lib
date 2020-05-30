import { Component, Prop } from 'vue-property-decorator'
import StoragePage from './storage-page.vue'
import { StorageType } from './base'

@Component
class AppStoragePage extends StoragePage {
  @Prop({ default: 'app' })
  storageType!: StorageType
}

export default AppStoragePage
