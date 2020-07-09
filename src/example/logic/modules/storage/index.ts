import * as path from 'path'
import { BasePathStorageLogic } from '@/lib'
import { Component } from 'vue-property-decorator'
import { config } from '@/lib/config'
import { store } from '../../store'

//========================================================================
//
//  Implementation
//
//========================================================================

@Component
class DocsStorageLogic extends BasePathStorageLogic {
  get basePath(): string {
    return path.join(config.storage.usersDir, store.user.id, config.storage.docsDir)
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { DocsStorageLogic }
