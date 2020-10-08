import { Component, Prop } from 'vue-property-decorator'
import { BaseStoragePage } from '@/app/views/base/storage'
import { StorageType } from '@/app/logic'

@Component
class AppStoragePage extends BaseStoragePage {
  @Prop({ default: 'app' })
  storageType!: StorageType
}

export default AppStoragePage
