import { BaseStoragePage, StorageType } from '../../base/storage'
import { StorageRoute, router } from '@/example/router'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from '@/lib'

@Component
class UserStoragePage extends BaseStoragePage {
  get storageType(): StorageType {
    return 'user'
  }

  get storageLogic(): StorageLogic {
    return this.$logic.userStorage
  }

  get storageRoute(): StorageRoute {
    return router.views.demo.userStorage
  }
}

export default UserStoragePage
