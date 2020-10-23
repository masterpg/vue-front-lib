import { AppStorageLogic } from '@/app/logic/modules/storage/app-storage'
import _path from 'path'
import { injectInternalLogic } from '@/app/logic/modules/internal'
import { injectStore } from '@/app/logic/store'
import { useConfig } from '@/app/config'
import { watch } from '@vue/composition-api'

//========================================================================
//
//  Implementation
//
//========================================================================

namespace UserStorageLogic {
  export function newInstance(): AppStorageLogic {
    return setup()
  }

  export function setup() {
    const base = AppStorageLogic.setup()

    const config = useConfig()
    const store = injectStore()
    const internal = injectInternalLogic()

    watch(
      () => internal.auth.isSignedIn.value,
      isSignedIn => {
        if (isSignedIn) {
          base.basePath.value = _path.join(config.storage.user.rootName, store.user.value.id)
        } else {
          base.basePath.value = ''
        }
      }
    )

    base.fetchRoot.value = async () => {
      // ユーザールートがストアに存在しない場合
      if (!base.existsHierarchicalOnStore()) {
        // ユーザールートをサーバーから読み込み
        await base.fetchHierarchicalNodes()
      }

      // サーバーからユーザールートを読み込んだ後でも、ユーザールートが存在しない場合
      if (!base.existsHierarchicalOnStore()) {
        // ユーザールートを作成
        await base.createHierarchicalDirs([''])
      }
    }

    return base
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { UserStorageLogic }
