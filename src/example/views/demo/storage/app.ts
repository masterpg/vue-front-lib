import { Component, Prop } from 'vue-property-decorator'
import { BaseStoragePage } from '../../base/storage'
import { StorageType } from '@/example/logic'

@Component
class AppStoragePage extends BaseStoragePage {
  @Prop({ default: 'app' })
  storageType!: StorageType
}

export default AppStoragePage
