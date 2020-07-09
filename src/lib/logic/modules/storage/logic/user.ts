import * as path from 'path'
import { BasePathStorageLogic } from './base-path'
import { Component } from 'vue-property-decorator'
import { config } from '@/lib/config'
import { store } from '../../../store'

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class UserStorageLogic extends BasePathStorageLogic {
  get basePath(): string {
    return path.join(config.storage.usersDir, store.user.id)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { UserStorageLogic }
