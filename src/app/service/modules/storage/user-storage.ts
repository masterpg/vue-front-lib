import { AppStorageService } from '@/app/service/modules/storage/app-storage'
import _path from 'path'
import { injectInternalService } from '@/app/service/modules/internal'
import { injectStore } from '@/app/service/store'
import { useConfig } from '@/app/config'
import { watch } from '@vue/composition-api'

//========================================================================
//
//  Implementation
//
//========================================================================

namespace UserStorageService {
  export function newInstance(): AppStorageService {
    return newRawInstance()
  }

  export function newRawInstance() {
    const base = AppStorageService.newRawInstance()

    const config = useConfig()
    const store = injectStore()
    const internal = injectInternalService()

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
        const apiNodes = await base.createHierarchicalDirsAPI([base.toFullPath('')])
        base.setAPINodesToStore(apiNodes)
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

export { UserStorageService }
