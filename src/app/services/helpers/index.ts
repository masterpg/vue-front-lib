import { ArticleHelper } from '@/app/services/helpers/article'
import { AuthHelper } from '@/app/services/helpers/auth'
import { StorageHelper } from '@/app/services/helpers/storage'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface HelperContainer {
  auth: AuthHelper
  article: ArticleHelper
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace HelperContainer {
  let instance: HelperContainer

  export function useHelper(helpers?: HelperContainer): HelperContainer {
    instance = helpers ?? instance ?? newRawInstance()
    return instance
  }

  export function newRawInstance(options?: Partial<HelperContainer>) {
    const auth = options?.auth ?? AuthHelper.newInstance()
    const article = options?.article ?? ArticleHelper.newInstance()

    return {
      auth,
      article,
    }
  }
}

//========================================================================
//
//  Export
//
//========================================================================

const { useHelper } = HelperContainer
export { ArticleHelper, AuthHelper, HelperContainer, StorageHelper, useHelper }
