import * as path from 'path'
import { Component } from 'vue-property-decorator'
import { SubStorageLogic } from '@/example/logic/modules/storage/logic/sub'
import { config } from '@/example/config'
import { store } from '@/example/logic/store'

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

  async fetchRoot(): Promise<void> {
    this.appStorage.validateSignedIn()

    // ユーザールートがストアに存在しない場合
    if (!this.appStorage.existsHierarchicalOnStore(this.basePath)) {
      // ユーザールートをサーバーから読み込み
      await this.appStorage.fetchHierarchicalNodes(this.basePath)
    }
    // サーバーからユーザールートを読み込んだ後でも、ユーザールートが存在しない場合
    if (!this.appStorage.existsHierarchicalOnStore(this.basePath)) {
      // ユーザールートを作成
      await this.appStorage.createHierarchicalDirs([this.basePath])
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { UserStorageLogic }
