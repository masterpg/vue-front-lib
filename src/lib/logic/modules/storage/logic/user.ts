import * as path from 'path'
import { Component } from 'vue-property-decorator'
import { SubStorageLogic } from './sub'
import { config } from '@/lib/config'
import { store } from '../../../store'

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class UserStorageLogic extends SubStorageLogic {
  get basePath(): string {
    return path.join(config.storage.user.rootName, store.user.id)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { UserStorageLogic }
