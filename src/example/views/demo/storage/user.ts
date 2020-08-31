import { Component, Prop } from 'vue-property-decorator'
import { BaseStoragePage } from '../../base/storage'
import { StorageType } from '@/lib'

@Component
class UserStoragePage extends BaseStoragePage {
  @Prop({ default: 'user' })
  storageType!: StorageType

  protected async initStorage(): Promise<void> {}
}

export default UserStoragePage
