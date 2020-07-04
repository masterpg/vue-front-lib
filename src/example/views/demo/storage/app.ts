import { Component, Prop } from 'vue-property-decorator'
import { StoragePage, StorageType } from '../../base/storage'

@Component
class AppStoragePage extends StoragePage {
  @Prop({ default: 'app' })
  storageType!: StorageType
}

export default AppStoragePage
