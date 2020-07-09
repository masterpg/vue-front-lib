import { BaseStoragePage, StorageType } from '../../base/storage'
import { StorageRoute, router } from '@/example/router'
import { Component } from 'vue-property-decorator'
import { StorageLogic } from '@/lib'

@Component
class AppStoragePage extends BaseStoragePage {
  get storageType(): StorageType {
    return 'app'
  }

  get storageLogic(): StorageLogic {
    return this.$logic.appStorage
  }

  get storageRoute(): StorageRoute {
    return router.views.demo.appStorage
  }
}

export default AppStoragePage
